# backend/api/management/commands/seed_teacher_assignments.py


from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction
from api.models import SubjectAssignment
from api.models.profile import WESTERN_CLASSES, ARABIC_CLASSES, PROGRAMMING_CLASSES

User = get_user_model()

# ── Subject sets by level/stream

JSS_SUBJECTS = [
    "english_language", "mathematics", "basic_science", "basic_technology",
    "social_studies", "civic_education", "business_studies",
    "cultural_creative_arts", "agricultural_science", "computer_studies_ict",
    "physical_health_education", "french", "religious_studies",
]

SSS_SCIENCE_SUBJECTS = [
    "english_language", "mathematics", "civic_education", "digital_technologies",
    "biology", "chemistry", "physics", "further_mathematics",
    "geography", "computer_studies_ict",
]

SSS_ARTS_SUBJECTS = [
    "english_language", "mathematics", "civic_education", "digital_technologies",
    "literature_in_english", "government", "nigerian_history",
    "geography", "christian_religious_studies",
]

SSS_COMMERCIAL_SUBJECTS = [
    "english_language", "mathematics", "civic_education", "digital_technologies",
    "financial_accounting", "commerce", "economics",
    "marketing", "government",
]

ARABIC_SUBJECTS = [
    "arabic", "islamic_religious_studies", "english_language",
    "mathematics", "civic_education",
]

PROGRAMMING_SUBJECTS = [
    "digital_technologies", "computer_studies_ict", "mathematics",
    "english_language", "basic_electronics",
]

JSS_CODES = {c[0] for c in WESTERN_CLASSES if c[0].startswith("jss")}


def subjects_for_student(profile):
    dept = profile.department or "western"
    sc   = profile.student_class or ""
    if dept == "arabic":      return ARABIC_SUBJECTS
    if dept == "programming": return PROGRAMMING_SUBJECTS
    if sc in JSS_CODES:       return JSS_SUBJECTS
    stream = profile.stream or ""
    return {
        "science":    SSS_SCIENCE_SUBJECTS,
        "arts":       SSS_ARTS_SUBJECTS,
        "commercial": SSS_COMMERCIAL_SUBJECTS,
    }.get(stream, SSS_SCIENCE_SUBJECTS)


class Command(BaseCommand):
    help = "Auto-assign teachers to students per subject."

    def add_arguments(self, parser):
        parser.add_argument("--overwrite",  action="store_true",
                            help="Re-assign even manually set assignments.")
        parser.add_argument("--teacher",    default=None,
                            help="Only process assignments for this teacher username.")
        parser.add_argument("--class",      dest="student_class", default=None,
                            help="Only process students in this class.")
        parser.add_argument("--clear-auto", action="store_true",
                            help="Delete all auto-assigned records first, then re-seed.")

    def handle(self, *args, **options):
        overwrite     = options["overwrite"]
        only_teacher  = options["teacher"]
        only_class    = options["student_class"]
        clear_auto    = options["clear_auto"]

        if clear_auto:
            deleted = SubjectAssignment.objects.filter(is_auto_assigned=True).count()
            SubjectAssignment.objects.filter(is_auto_assigned=True).delete()
            self.stdout.write(f"Cleared {deleted} auto-assigned records.")

        students_qs = User.objects.filter(
            profile__role="student"
        ).select_related("profile")

        if only_class:
            students_qs = students_qs.filter(profile__student_class=only_class)

        students = list(students_qs)
        self.stdout.write(f"\nSeeding subject assignments for {len(students)} student(s)...\n")

        created = updated = skipped = 0

        with transaction.atomic():
            for student in students:
                profile = student.profile
                dept    = profile.department or "western"
                sc      = profile.student_class or ""

                # ── Get teachers for this department ──────────────────────
                teachers_qs = User.objects.filter(
                    profile__role="teacher",
                    profile__department=dept,
                ).select_related("profile")

                if only_teacher:
                    teachers_qs = teachers_qs.filter(username=only_teacher)

                class_teachers   = [t for t in teachers_qs if getattr(t.profile, "teacher_type", "") == "class"]
                subject_teachers = [t for t in teachers_qs if getattr(t.profile, "teacher_type", "") == "subject"]
                all_teachers     = list(teachers_qs)

                subject_list = subjects_for_student(profile)

                for i, subject in enumerate(subject_list):
                    # Determine best teacher for this subject:
                    # 1. Prefer a subject teacher (round-robin among subject teachers)
                    # 2. Fall back to class teacher if they teach this class
                    # 3. Fall back to any teacher in dept
                    if subject_teachers:
                        teacher = subject_teachers[i % len(subject_teachers)]
                    elif class_teachers:
                        # Class teachers: only assign if student is in their class
                        ct_for_class = [t for t in class_teachers
                                        if getattr(t.profile, "student_class", "") == sc
                                        or not getattr(t.profile, "student_class", "")]
                        teacher = ct_for_class[0] if ct_for_class else (all_teachers[i % len(all_teachers)] if all_teachers else None)
                    elif all_teachers:
                        teacher = all_teachers[i % len(all_teachers)]
                    else:
                        teacher = None

                    existing = SubjectAssignment.objects.filter(
                        student=student, subject=subject
                    ).first()

                    if existing:
                        if overwrite or existing.is_auto_assigned:
                            existing.teacher          = teacher
                            existing.is_auto_assigned = True
                            existing.save(update_fields=["teacher","is_auto_assigned"])
                            updated += 1
                        else:
                            skipped += 1
                        continue

                    SubjectAssignment.objects.create(
                        student=student, teacher=teacher,
                        subject=subject, is_auto_assigned=True,
                    )
                    created += 1

        self.stdout.write(self.style.SUCCESS(
            f"\nDone. {created} created, {updated} updated, {skipped} manual preserved.\n"
            "To re-assign specific subjects: use Manage Users → Subject Assignments in admin.\n"
        ))