# backend/api/management/commands/assign_teacher.py


from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Assign a teacher to a class + subjects (replaces old auto-assigned records)"

    def add_arguments(self, parser):
        parser.add_argument("--teacher",   required=True, help="Teacher username")
        parser.add_argument("--class",     dest="student_class", default=None,
                            help="Class code e.g. jss2, sss1_sci")
        parser.add_argument("--subjects",  nargs="+", default=[],
                            help="Subject codes e.g. mathematics english_language")
        parser.add_argument("--dry-run",   action="store_true")
        parser.add_argument("--clear-all", action="store_true",
                            help="Clear all auto-assigned records for this teacher only")
        parser.add_argument("--list",      action="store_true",
                            help="List current assignments for this teacher")

    def handle(self, *args, **options):
        from django.contrib.auth import get_user_model
        from api.models import SubjectAssignment, Profile
        User = get_user_model()

        username = options["teacher"]
        cls      = options["student_class"]
        subjects = options["subjects"]
        dry      = options["dry_run"]
        prefix   = "[DRY RUN] " if dry else ""

        # ── Get teacher ───────────────────────────────────────────────────
        try:
            teacher = User.objects.select_related("profile").get(username=username)
        except User.DoesNotExist:
            raise CommandError(f"User '{username}' not found")

        name = teacher.get_full_name() or username
        role = getattr(teacher.profile, "role", "?")
        dept = getattr(teacher.profile, "department", "?")
        self.stdout.write(f"\nTeacher: {name} ({username}) | role={role} | dept={dept}\n")

        # ── --list mode ───────────────────────────────────────────────────
        if options["list"]:
            from itertools import groupby
            qs = SubjectAssignment.objects.filter(teacher=teacher)\
                .select_related("student__profile")\
                .order_by("subject", "student__profile__student_class")
            if not qs.exists():
                self.stdout.write("  No assignments found.")
                return
            current_subject = None
            for sa in qs:
                if sa.subject != current_subject:
                    current_subject = sa.subject
                    self.stdout.write(f"\n  📚 {sa.get_subject_display()}")
                cls_label = getattr(sa.student.profile, "student_class", "?")
                auto = "auto" if sa.is_auto_assigned else "manual"
                self.stdout.write(f"     {sa.student.get_full_name() or sa.student.username:25s} [{cls_label}] ({auto})")
            return

        # ── --clear-all mode ──────────────────────────────────────────────
        auto_qs = SubjectAssignment.objects.filter(teacher=teacher, is_auto_assigned=True)
        count   = auto_qs.count()
        if options["clear_all"]:
            self.stdout.write(f"{prefix}Clearing {count} auto-assigned records for {username}...")
            if not dry:
                auto_qs.delete()
                self.stdout.write(self.style.SUCCESS("Done."))
            return

        # ── Validate inputs for assign mode ───────────────────────────────
        if not cls:
            raise CommandError("--class is required for assignment. Use --list to see current assignments.")
        if not subjects:
            raise CommandError("--subjects is required. E.g. --subjects mathematics english_language")

        # ── Clear existing auto-assigned for this teacher ─────────────────
        self.stdout.write(f"{prefix}Clearing {count} existing auto-assigned records...")
        if not dry:
            auto_qs.delete()

        # ── Get students in target class ──────────────────────────────────
        students = Profile.objects.filter(
            role="student", student_class=cls
        ).select_related("user")

        if not students.exists():
            self.stdout.write(self.style.WARNING(f"  No students found in class '{cls}'"))
            return

        self.stdout.write(f"{prefix}Assigning {name} to class={cls}, "
                          f"subjects=[{', '.join(subjects)}], "
                          f"students={students.count()}\n")

        # ── Create assignments ────────────────────────────────────────────
        created = skipped = 0
        for profile in students:
            for subject in subjects:
                self.stdout.write(f"  {prefix}{profile.user.get_full_name() or profile.user.username:25s} ← {subject}")
                if not dry:
                    _, was_created = SubjectAssignment.objects.get_or_create(
                        student=profile.user,
                        subject=subject,
                        defaults={"teacher": teacher, "is_auto_assigned": True},
                    )
                    if was_created:
                        created += 1
                    else:
                        # Update teacher on existing record
                        SubjectAssignment.objects.filter(
                            student=profile.user, subject=subject
                        ).update(teacher=teacher, is_auto_assigned=True)
                        skipped += 1
                else:
                    created += 1

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(
            f"{prefix}Done. {created} {'would be ' if dry else ''}assigned"
            + (f", {skipped} updated" if skipped else "") + "."
        ))