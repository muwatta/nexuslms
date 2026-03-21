# backend/api/management/commands/debug_teacher.py
# Run: python manage.py debug_teacher
# Shows exactly what subjects/students are assigned to each teacher

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Debug teacher subject assignments"

    def handle(self, *args, **options):
        from django.contrib.auth import get_user_model
        from api.models.subjectassignment import SubjectAssignment

        User = get_user_model()

        teachers = User.objects.filter(profile__role="teacher").select_related("profile")
        for teacher in teachers:
            assignments = SubjectAssignment.objects.filter(
                teacher=teacher
            ).select_related("student", "student__profile").order_by("subject")

            subjects = list(dict.fromkeys(a.subject for a in assignments))
            students = list(dict.fromkeys(a.student.username for a in assignments))

            self.stdout.write(
                f"\n{teacher.username} ({getattr(teacher.profile, 'teacher_type', '?')})"
                f" — {len(subjects)} subjects, {len(assignments)} total assignments"
            )
            for subj in subjects:
                subj_students = [a.student for a in assignments if a.subject == subj]
                self.stdout.write(
                    f"  {subj}: {[s.username for s in subj_students]}"
                )

        # Also show unassigned subjects (teacher=None)
        unassigned = SubjectAssignment.objects.filter(teacher=None).count()
        self.stdout.write(f"\nUnassigned subject slots: {unassigned}")