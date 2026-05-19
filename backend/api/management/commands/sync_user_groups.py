# backend/api/management/commands/sync_user_groups

from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group
from django.db import transaction


ROLE_GROUP_MAP = {
    "super_admin":  "User Managers",
    "admin":        "User Managers",
    "school_admin": "User Managers",
    "teacher":      "Teachers",
    "non_teaching": "Non-Teaching Staff",
    "student":      "Students",
    "parent":       "Visitors",
    "visitor":      "Visitors",
}

ALL_MANAGED_GROUPS = set(ROLE_GROUP_MAP.values())

OLD_NAMES_TO_CLEAN = {"Teacher", "Student", "SuperAdmin", "Admin",
                      "SchoolAdmin", "NonTeaching", "Parent", "Visitor"}


class Command(BaseCommand):
    help = "Sync all user profiles to the correct Django auth groups"

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true")

    def handle(self, *args, **options):
        from api.core.models import Profile

        dry_run = options["dry_run"]
        prefix  = "[DRY RUN] " if dry_run else ""

        self.stdout.write(self.style.WARNING(f"{prefix}Syncing user groups…\n"))

        if not dry_run:
            for group_name in ALL_MANAGED_GROUPS:
                Group.objects.get_or_create(name=group_name)

        profiles = Profile.objects.select_related("user").all()
        fixed = 0
        skipped = 0

        with transaction.atomic():
            for profile in profiles:
                user = profile.user
                role = profile.role
                target = ROLE_GROUP_MAP.get(role)

                if not target:
                    self.stdout.write(f"  ⚠️  {user.username}: unknown role '{role}' — skipping")
                    skipped += 1
                    continue

                groups_to_remove = user.groups.filter(
                    name__in=ALL_MANAGED_GROUPS | OLD_NAMES_TO_CLEAN
                )
                current = set(user.groups.values_list("name", flat=True))
                already_correct = target in current and len(groups_to_remove) == 1

                if already_correct:
                    skipped += 1
                    continue

                if not dry_run:
                    user.groups.remove(*groups_to_remove)
                    target_group = Group.objects.get(name=target)
                    user.groups.add(target_group)

                self.stdout.write(
                    f"  ✅  {user.username} ({role}) → {target}"
                )
                fixed += 1

        if not dry_run:
            for name in OLD_NAMES_TO_CLEAN:
                deleted, _ = Group.objects.filter(name=name, api_user_set__isnull=True).delete()
                if deleted:
                    self.stdout.write(f"  🗑️  Deleted empty legacy group '{name}'")

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(
            f"{prefix}Done. {fixed} users synced, {skipped} already correct."
        ))
        self.stdout.write(self.style.SUCCESS(
            "\nGroup summary after sync:"
        ))
        for group_name in sorted(ALL_MANAGED_GROUPS):
            count = Group.objects.filter(name=group_name).first()
            from django.contrib.auth import get_user_model; UM = get_user_model(); n = UM.objects.filter(groups__name=group_name).count()
            self.stdout.write(f"  {group_name}: {n} members")