"""
Management command to repair department values that were corrupted by bulk import.
Normalizes invalid department labels to correct codes, or leaves them NULL if unrecognized.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from api.core.models import Profile

User = get_user_model()

# Mapping of common human labels to correct internal codes
DEPARTMENT_REPAIR_MAP = {
    "western school": "western",
    "western education": "western",
    "western": "western",
    "arabic school": "arabic",
    "arabic/islamic studies": "arabic",
    "arabic": "arabic",
    "digital school": "programming",
    "digital technology": "programming",
    "programming": "programming",
    "technology": "programming",
}

# Valid department codes
VALID_DEPARTMENTS = {"western", "arabic", "programming"}


class Command(BaseCommand):
    help = """
    Normalize department values in the database.
    
    Finds profiles with invalid department values (from bulk import corruption)
    and either normalizes them to correct codes or sets them to NULL if unrecognized.
    
    Use --dry-run to preview changes without modifying the database.
    """

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be changed without modifying the database",
        )

    def handle(self, *args, **options):
        dry_run = options.get("dry_run", False)

        self.stdout.write(self.style.SUCCESS("=" * 70))
        self.stdout.write(self.style.SUCCESS("Department Normalization Report"))
        self.stdout.write(self.style.SUCCESS("=" * 70))

        if dry_run:
            self.stdout.write(
                self.style.WARNING("DRY RUN MODE — No changes will be made.\n")
            )

        # Find all profiles with department values
        profiles_with_dept = Profile.objects.filter(department__isnull=False).exclude(
            department=""
        )

        stats = {
            "total_checked": profiles_with_dept.count(),
            "already_valid": 0,
            "normalized": 0,
            "set_to_null": 0,
            "details": [],
        }

        for profile in profiles_with_dept:
            current_dept = profile.department
            current_dept_lower = current_dept.lower().strip()

            # Check if it's already valid
            if current_dept in VALID_DEPARTMENTS:
                stats["already_valid"] += 1
                continue

            # Try to normalize it
            normalized = DEPARTMENT_REPAIR_MAP.get(current_dept_lower)

            if normalized:
                stats["normalized"] += 1
                stats["details"].append(
                    {
                        "user": profile.user.username,
                        "action": "normalize",
                        "from": current_dept,
                        "to": normalized,
                    }
                )

                if not dry_run:
                    profile.department = normalized
                    profile.save()

            else:
                stats["set_to_null"] += 1
                stats["details"].append(
                    {
                        "user": profile.user.username,
                        "action": "set_null",
                        "from": current_dept,
                        "to": None,
                    }
                )

                if not dry_run:
                    profile.department = None
                    profile.save()

        # Print results
        self.stdout.write(f"\nTotal profiles checked:     {stats['total_checked']}")
        self.stdout.write(
            self.style.SUCCESS(f"Already valid:             {stats['already_valid']}")
        )
        self.stdout.write(
            self.style.WARNING(f"Will be normalized:        {stats['normalized']}")
        )
        self.stdout.write(
            self.style.ERROR(f"Will be set to NULL:       {stats['set_to_null']}")
        )

        if stats["details"]:
            self.stdout.write("\n" + "=" * 70)
            self.stdout.write("Detailed Changes:")
            self.stdout.write("=" * 70)

            for detail in stats["details"]:
                user = detail["user"]
                action = detail["action"]
                from_val = detail["from"]
                to_val = detail["to"]

                if action == "normalize":
                    self.stdout.write(
                        f"  {user:20} | {from_val:20} → {to_val:20}"
                    )
                else:  # set_null
                    self.stdout.write(
                        f"  {user:20} | {from_val:20} → {str(to_val):20}"
                    )

        self.stdout.write("\n" + "=" * 70)

        if dry_run:
            self.stdout.write(
                self.style.WARNING("DRY RUN — Run without --dry-run to apply changes.")
            )
        else:
            if stats["normalized"] + stats["set_to_null"] > 0:
                self.stdout.write(
                    self.style.SUCCESS("✓ Department normalization complete!")
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS("✓ All departments are already valid.")
                )

        self.stdout.write(self.style.SUCCESS("=" * 70))
