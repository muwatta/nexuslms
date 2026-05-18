# backend/api/management/commands/migrate_instructor_to_teacher.py

from django.core.management.base import BaseCommand
from django.db import transaction


class Command(BaseCommand):
    help = "Migrate instructor → teacher role in all Profile records."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be changed without saving.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]

        # Import here to avoid AppRegistryNotReady
        from backend.api.core.models import Profile

        profiles = Profile.objects.filter(role="instructor")
        count = profiles.count()

        if count == 0:
            self.stdout.write(self.style.SUCCESS("No instructor profiles found. Nothing to migrate."))
            return

        self.stdout.write(f"\nFound {count} profile(s) with role='instructor'.\n")

        if dry_run:
            for p in profiles:
                self.stdout.write(
                    f"  DRY-RUN: {p.user.username} → role=teacher, "
                    f"teacher_type={getattr(p, 'instructor_type', None)}"
                )
            self.stdout.write("\n[Dry run — no changes made]\n")
            return

        with transaction.atomic():
            for p in profiles:
                old_type = getattr(p, "instructor_type", None) or ""
                p.role = "teacher"
                # Map instructor_type → teacher_type
                # 'class' and 'subject' values are kept the same
                p.teacher_type = old_type if old_type in ("class", "subject") else "subject"
                p.save()
                self.stdout.write(
                    f"  Migrated: {p.user.username} → teacher (teacher_type={p.teacher_type})"
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"\nDone. {count} instructor(s) migrated to teacher role.\n"
                "Next steps:\n"
                "  1. Run: python manage.py fix_group_permissions\n"
                "  2. Run: python manage.py seed_teacher_assignments\n"
            )
        )