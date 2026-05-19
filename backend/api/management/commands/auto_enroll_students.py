# backend/api/management/commands/auto_enroll_students.py
# ─────────────────────────────────────────────────────────────────────────────
# Management command: auto_enroll_students
#
# Usage:
#   python manage.py auto_enroll_students
#   python manage.py auto_enroll_students --department western
#   python manage.py auto_enroll_students --dry-run
#
# What it does:
#   For every student profile that has a student_class set, finds all active
#   Course objects matching (department, student_class) and creates Enrollment
#   records for any that don't already exist.
#
# Run this ONCE after deploying this feature to backfill existing students.
# Safe to run multiple times — uses get_or_create so no duplicates.
# ─────────────────────────────────────────────────────────────────────────────

from django.core.management.base import BaseCommand
from django.db import transaction


class Command(BaseCommand):
    help = "Auto-enroll all existing students into courses matching their class"

    def add_arguments(self, parser):
        parser.add_argument(
            "--department",
            type=str,
            default=None,
            help="Only process students in this department (e.g. western)",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be enrolled without actually doing it",
        )

    def handle(self, *args, **options):
        from api.core.models import Profile, Course, Enrollment
        from django.utils import timezone

        def _academic_year():
            now = timezone.now()
            return f"{now.year - 1}/{now.year}" if now.month <= 8 else f"{now.year}/{now.year + 1}"

        def _current_term():
            m = timezone.now().month
            if m >= 9:   return "First Term"
            elif m <= 3: return "Second Term"
            return "Third Term"

        academic_year = _academic_year()
        term          = _current_term()

        dry_run    = options["dry_run"]
        department = options["department"]

        self.stdout.write(self.style.WARNING(
            f"{'[DRY RUN] ' if dry_run else ''}Auto-enrolling students..."
        ))

        # Get all student profiles with a class assigned
        students = Profile.objects.filter(
            role="student",
        ).exclude(student_class__isnull=True).exclude(student_class="")

        if department:
            students = students.filter(department=department)

        total_enrolled = 0
        total_skipped  = 0
        total_students = 0

        for profile in students.select_related("user"):
            student_class = profile.student_class
            dept          = profile.department

            if not dept:
                self.stdout.write(
                    f"  ⚠️  {profile.user.username} has class={student_class} "
                    f"but no department — skipping"
                )
                continue

            courses = Course.objects.filter(
                department=dept,
                student_class=student_class,
                is_active=True,
            )

            if not courses.exists():
                self.stdout.write(
                    f"  ℹ️  {profile.user.username} ({dept}/{student_class}): "
                    f"no active courses found"
                )
                continue

            student_enrolled = 0
            student_skipped  = 0

            for course in courses:
                already = Enrollment.objects.filter(
                    student=profile,
                    course=course,
                    academic_year=academic_year,
                    term=term,
                ).exists()

                if already:
                    student_skipped += 1
                else:
                    if not dry_run:
                        with transaction.atomic():
                            Enrollment.objects.get_or_create(
                                student=profile,
                                course=course,
                                academic_year=academic_year,
                                term=term,
                                defaults={"status": "active"},
                            )
                    student_enrolled += 1

            name = (
                f"{profile.user.first_name} {profile.user.last_name}".strip()
                or profile.user.username
            )
            self.stdout.write(
                f"  ✅  {name} ({dept}/{student_class}): "
                f"+{student_enrolled} enrolled, {student_skipped} already enrolled"
            )
            total_enrolled += student_enrolled
            total_skipped  += student_skipped
            total_students += 1

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(
            f"{'[DRY RUN] ' if dry_run else ''}Done. "
            f"{total_students} students processed — "
            f"{total_enrolled} new enrollments created, "
            f"{total_skipped} already existed."
        ))