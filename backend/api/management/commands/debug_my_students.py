# backend/api/management/commands/debug_my_students.py
# Run: python manage.py debug_my_students --teacher abu_ruqayyah

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Debug /api/subject-assignments/my_students/ response for a teacher"

    def add_arguments(self, parser):
        parser.add_argument("--teacher", default="abu_ruqayyah")

    def handle(self, *args, **options):
        from django.contrib.auth import get_user_model
        from api.models.subjectassignment import SubjectAssignment
        from api.models import Course

        User = get_user_model()
        try:
            user = User.objects.get(username=options["teacher"])
        except User.DoesNotExist:
            self.stdout.write(f"User '{options['teacher']}' not found"); return

        qs = SubjectAssignment.objects.filter(
            teacher=user
        ).select_related("student", "student__profile").order_by("subject", "student__username")

        grouped = {}
        for sa in qs:
            key = sa.subject
            if key not in grouped:
                grouped[key] = {"subject": key, "subject_display": sa.get_subject_display(), "students": []}
            p = getattr(sa.student, "profile", None)
            fn = f"{sa.student.first_name} {sa.student.last_name}".strip() or sa.student.username
            grouped[key]["students"].append({
                "id":            sa.student.id,
                "username":      sa.student.username,
                "full_name":     fn,
                "student_id":    getattr(p, "student_id", "") or "",
                "class":         getattr(p, "student_class", None),
                "class_section": getattr(p, "class_section", "") or "",
            })

        self.stdout.write(f"\n=== my_students for {user.username} ===")
        for subj_data in grouped.values():
            self.stdout.write(f"\n  Subject: {subj_data['subject']} ({subj_data['subject_display']})")
            for st in subj_data["students"][:2]:  # show first 2
                self.stdout.write(f"    {st['full_name']:20s} | class={st['class']} | section={st['class_section']} | id={st['student_id']}")

        # Now check course matching
        self.stdout.write(f"\n=== Course matching for Ibrahim's subjects ===")
        dept = getattr(user.profile, "department", "western")
        courses = Course.objects.filter(department=dept)
        my_subjects = list(grouped.keys())

        self.stdout.write(f"Subjects: {my_subjects}")
        self.stdout.write(f"Total courses in {dept}: {courses.count()}")

        # Check which courses match
        for subj in my_subjects:
            subj_words = subj.lower().replace("_", " ").split()
            first_word = subj_words[0]
            matches = [c for c in courses if first_word in c.title.lower()]
            self.stdout.write(f"\n  {subj} (first word: '{first_word}') → {len(matches)} course matches")
            for m in matches[:3]:
                self.stdout.write(f"    [{m.student_class}] {m.title}")

        # Unique classes from students
        all_classes = set()
        for subj_data in grouped.values():
            for st in subj_data["students"]:
                if st["class"]:
                    all_classes.add(st["class"])
        self.stdout.write(f"\n=== Unique classes from students: {sorted(all_classes)} ===")