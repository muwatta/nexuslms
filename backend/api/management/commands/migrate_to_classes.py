# backend/api/management/commands/migrate_to_base_classes.py

from django.core.management.base import BaseCommand
from django.db import transaction

# Old section code → (base_class, section_label)
REMAP = {
    "jss1a": ("jss1", "A"), "jss1b": ("jss1", "B"), "jss1c": ("jss1", "C"),
    "jss2a": ("jss2", "A"), "jss2b": ("jss2", "B"), "jss2c": ("jss2", "C"),
    "jss3a": ("jss3", "A"), "jss3b": ("jss3", "B"), "jss3c": ("jss3", "C"),
}

OLD_SECTION_CLASSES = list(REMAP.keys())


class Command(BaseCommand):
    help = "Migrate old section-based class codes (jss1a…) to base class + section field"

    def add_arguments(self, parser):
        parser.add_argument("--dry-run",       action="store_true", help="Show changes without saving")
        parser.add_argument("--skip-courses",  action="store_true", help="Skip deleting old section courses")
        parser.add_argument("--skip-enroll",   action="store_true", help="Skip re-enrollment step")

    def handle(self, *args, **options):
        from backend.api.core.models import Profile, Course, Enrollment

        dry     = options["dry_run"]
        prefix  = "[DRY RUN] " if dry else ""

        self.stdout.write(self.style.WARNING(f"{prefix}Migrating to base classes…\n"))

        # ── Step 1: Remap student profiles ────────────────────────────────────
        self.stdout.write("Step 1: Remapping student profiles")
        students = Profile.objects.filter(role="student", student_class__in=OLD_SECTION_CLASSES)
        self.stdout.write(f"  Found {students.count()} students with old section codes")

        remapped = 0
        for p in students:
            base, section = REMAP[p.student_class]
            self.stdout.write(
                f"  {p.user.username:20s}  {p.student_class} → {base} (section {section})"
            )
            if not dry:
                with transaction.atomic():
                    p.student_class  = base
                    p.class_section  = section
                    p.save(update_fields=["student_class", "class_section"])
            remapped += 1

        self.stdout.write(self.style.SUCCESS(
            f"  {'Would remap' if dry else 'Remapped'} {remapped} students\n"
        ))

        # ── Step 2: Delete old section-based courses ──────────────────────────
        if not options["skip_courses"]:
            self.stdout.write("Step 2: Removing old section-based courses")
            old_courses = Course.objects.filter(
                department="western",
                student_class__in=OLD_SECTION_CLASSES,
            )
            count = old_courses.count()
            self.stdout.write(f"  Found {count} old section courses (jss1a, jss1b, jss1c, …)")

            if not dry and count > 0:
                # Remove enrollments first (FK constraint)
                enroll_count = Enrollment.objects.filter(course__in=old_courses).count()
                Enrollment.objects.filter(course__in=old_courses).delete()
                old_courses.delete()
                self.stdout.write(self.style.SUCCESS(
                    f"  Deleted {count} courses and {enroll_count} enrollments\n"
                ))
            else:
                self.stdout.write(f"  {'Would delete' if dry else 'Nothing to delete'} {count} courses\n")

        # ── Step 3: Seed new base-class courses 
        if not dry and not options["skip_courses"]:
            self.stdout.write("Step 3: Seeding base-class courses")
            from django.core.management import call_command
            call_command("seed_western_courses")

        # ── Step 4: Re-enroll students 
        if not dry and not options["skip_enroll"]:
            self.stdout.write("\nStep 4: Re-enrolling students in base-class courses")
            from django.core.management import call_command
            call_command("auto_enroll_students", department="western")

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(
            f"{'[DRY RUN] ' if dry else ''}Migration complete."
        ))
        if dry:
            self.stdout.write("  Run without --dry-run to apply changes.")