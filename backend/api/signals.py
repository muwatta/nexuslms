# backend/api/signals.py


from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone


# ── Helpers 

def _current_academic_year() -> str:
    """Return current academic year string e.g. '2025/2026'."""
    now = timezone.now()
    # Nigerian academic year runs Sept–Aug
    if now.month >= 9:
        return f"{now.year}/{now.year + 1}"
    return f"{now.year - 1}/{now.year}"


def _current_term() -> str:
    """
    Approximate current term by month.
    First Term:  Sept–Dec
    Second Term: Jan–Apr
    Third Term:  May–Aug
    """
    month = timezone.now().month
    if month >= 9:
        return "First Term"
    if month >= 5:
        return "Third Term"
    return "Second Term"


def _auto_enroll_student(profile):
    """
    Enroll student profile in all active Courses matching
    (department, student_class) for the current academic_year + term.
    Returns (created_count, skipped_count).
    """
    from api.models import Course, Enrollment

    student_class = getattr(profile, "student_class", None)
    department    = getattr(profile, "department",    None)

    if not student_class or not department:
        return 0, 0

    courses = Course.objects.filter(
        department=department,
        student_class=student_class,
        is_active=True,
    )

    academic_year = _current_academic_year()
    term          = _current_term()
    created = 0
    skipped = 0

    for course in courses:
        _, was_created = Enrollment.objects.get_or_create(
            student=profile,
            course=course,
            academic_year=academic_year,
            term=term,
            defaults={"status": "active"},
        )
        if was_created:
            created += 1
        else:
            skipped += 1

    return created, skipped


def _unenroll_old_class(profile, old_class):
    """
    Drop active enrollments from old-class courses — only if no assignment
    submissions exist for that course (prevents data loss).
    """
    from api.models import Course, Enrollment

    department = getattr(profile, "department", None)
    if not department or not old_class:
        return

    old_courses = Course.objects.filter(
        department=department,
        student_class=old_class,
    )

    for course in old_courses:
        for enrollment in Enrollment.objects.filter(
            student=profile,
            course=course,
            status="active",
        ):
            has_submissions = False
            try:
                has_submissions = profile.assignments.filter(course=course).exists()
            except Exception:
                pass
            if not has_submissions:
                enrollment.delete()


# ── Store old student_class BEFORE save ───────────────────────────────────────

@receiver(pre_save, sender="api.Profile")
def profile_pre_save(sender, instance, **kwargs):
    """Cache previous student_class so post_save can detect changes."""
    if instance.pk:
        try:
            old = sender.objects.get(pk=instance.pk)
            instance._old_student_class = old.student_class
            instance._old_department    = old.department
        except sender.DoesNotExist:
            instance._old_student_class = None
            instance._old_department    = None
    else:
        instance._old_student_class = None
        instance._old_department    = None


# ── Auto-enroll AFTER save 

@receiver(post_save, sender="api.Profile")
def profile_post_save(sender, instance, created, **kwargs):
    """
    After a Profile is saved — if role=student and student_class changed:
      1. Unenroll from old class (safe, no submitted work lost).
      2. Enroll in all active courses for new class + department.
    """
    if getattr(instance, "role", None) != "student":
        return

    new_class = getattr(instance, "student_class", None)
    old_class = getattr(instance, "_old_student_class", None)

    if new_class == old_class and not created:
        return

    if old_class and old_class != new_class:
        _unenroll_old_class(instance, old_class)

    if new_class:
        _auto_enroll_student(instance)
        _auto_assign_subjects(instance)


def _auto_assign_subjects(profile):
    """
    When a student is assigned to a class, auto-assign them to teachers
    in their department who teach that class.  Only creates assignments
    that don't already exist (safe to call multiple times).
    """
    from api.models.subjectassignment import SubjectAssignment
    from django.contrib.auth import get_user_model
    User = get_user_model()

    student_class = getattr(profile, "student_class", None)
    department    = getattr(profile, "department", None)
    if not student_class or not department:
        return

    # Find teachers in the same department
    teachers = User.objects.filter(
        profile__role="teacher",
        profile__department=department,
    ).select_related("profile")

    if not teachers.exists():
        return

    # Get all subjects that have courses for this class
    from api.models import Course
    subjects = list(
        Course.objects.filter(
            department=department,
            student_class=student_class,
            is_active=True,
        ).values_list("title", flat=True)
    )

    if not subjects:
        return

    # Assign first available teacher per subject (round-robin if multiple)
    # This is a simple auto-assign — admin can override manually
    teacher_list = list(teachers)
    created_count = 0

    # Use subject code mapping from course title
    # e.g. "Mathematics — JSS 2" → derive subject key from first word
    SUBJECT_MAP = {
        "english": "english_language", "mathematics": "mathematics",
        "basic science": "basic_science", "basic technology": "basic_technology",
        "social studies": "social_studies", "civic": "civic_education",
        "cultural": "cultural_creative_arts", "physical": "physical_health_education",
        "computer": "computer_studies_ict", "religious": "religious_studies",
        "agricultural": "agricultural_science", "home": "home_management",
        "business": "business_studies", "french": "french",
        "arabic": "arabic", "yoruba": "yoruba",
        "biology": "biology", "chemistry": "chemistry",
        "physics": "physics", "further": "further_mathematics",
        "geography": "geography", "literature": "literature_in_english",
        "government": "government", "economics": "economics",
        "commerce": "commerce", "financial": "financial_accounting",
        "marketing": "marketing", "music": "music",
        "visual": "visual_arts", "health": "health_education",
    }

    for i, course_title in enumerate(subjects):
        first_word = course_title.split()[0].lower() if course_title else ""
        subject_key = SUBJECT_MAP.get(first_word)
        if not subject_key:
            continue

        teacher = teacher_list[i % len(teacher_list)]

        _, was_created = SubjectAssignment.objects.get_or_create(
            student=profile.user,
            subject=subject_key,
            defaults={
                "teacher": teacher,
                "is_auto_assigned": True,
            },
        )
        if was_created:
            created_count += 1

    if created_count:
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"[signal] Auto-assigned {created_count} subjects for {profile.user.username}")


# ── Sync role → Django Groups (called explicitly, NOT as a receiver) ──────────

def sync_role_to_groups(sender, instance, created, **kwargs):
    """
    Sync Profile.role to Django auth Groups.
    Called explicitly from admin_views.py — NOT registered as post_save
    receiver to avoid double-firing.
    """
    from django.contrib.auth.models import Group

    # ── Group names MUST match exactly what is in the DB (from fix_group_permissions) ──
    ROLE_GROUP_MAP = {
        "super_admin":  "User Managers",   # super admins get full user management
        "admin":        "User Managers",
        "school_admin": "User Managers",
        "teacher":      "Teachers",        # was "Teacher" — DB has "Teachers" (plural)
        "non_teaching": "Non-Teaching Staff",
        "student":      "Students",        # was "Student" — DB has "Students" (plural)
        "parent":       "Visitors",
        "visitor":      "Visitors",
    }

    role = getattr(instance, "role", None)
    user = getattr(instance, "user", None)
    if not role or not user:
        return

    target_group_name = ROLE_GROUP_MAP.get(role)
    if not target_group_name:
        return

    all_role_group_names = set(ROLE_GROUP_MAP.values())
    user.groups.remove(*user.groups.filter(name__in=all_role_group_names))
    group, _ = Group.objects.get_or_create(name=target_group_name)
    user.groups.add(group)