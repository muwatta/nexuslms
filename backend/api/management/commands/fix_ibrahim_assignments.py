from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Fix teacher subject assignments for an import mismatch or bad role assignment"

    def add_arguments(self, parser):
        parser.add_argument(
            "--username",
            required=True,
            help="Teacher username",
        )
        parser.add_argument(
            "--class",
            dest="student_class",
            default=None,
            help="Class code e.g. jss2, sss1_sci",
        )
        parser.add_argument(
            "--subjects",
            nargs="+",
            default=[],
            help="Subject codes e.g. mathematics english_language",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would happen without changing data",
        )
        parser.add_argument(
            "--clear-all",
            action="store_true",
            help="Clear all auto-assigned records for this teacher only",
        )
        parser.add_argument(
            "--list",
            action="store_true",
            help="List current assignments for this teacher",
        )

    def handle(self, *args, **options):
        username = options["username"]
        student_class = options["student_class"]
        subjects = options["subjects"]
        dry_run = options["dry_run"]
        clear_all = options["clear_all"]
        list_mode = options["list"]

        if list_mode:
            self.stdout.write(f"Listing assignments for {username}...")
            call_command(
                "assign_teacher",
                teacher=username,
                list=True,
                dry_run=dry_run,
            )
            return

        if clear_all:
            self.stdout.write(f"Clearing auto-assigned assignments for {username}...")
            call_command(
                "assign_teacher",
                teacher=username,
                clear_all=True,
                dry_run=dry_run,
            )
            return

        if not student_class:
            raise CommandError("--class is required unless --list or --clear-all is provided")
        if not subjects:
            raise CommandError("--subjects is required unless --list or --clear-all is provided")

        self.stdout.write(
            f"Fixing assignments for {username} in class {student_class} with subjects {', '.join(subjects)}..."
        )
        call_command(
            "assign_teacher",
            teacher=username,
            student_class=student_class,
            subjects=subjects,
            dry_run=dry_run,
        )
