

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Debug assignment creation — shows exact validation errors"

    def handle(self, *args, **options):
        from api.models import Profile, Course
        from api.serializers import AssignmentSerializer
        from django.contrib.auth import get_user_model
        User = get_user_model()

        # Find Ibrahim
        try:
            user = User.objects.get(username="abu_ruqayyah")
        except User.DoesNotExist:
            user = User.objects.filter(profile__role="teacher").first()
            if not user:
                self.stdout.write("No teacher found"); return

        self.stdout.write(f"Testing as: {user.username} ({user.profile.role})")

        # Find a JSS 2 course
        course = Course.objects.filter(department="western", student_class="jss2").first()
        if not course:
            self.stdout.write("No jss2 course found"); return

        self.stdout.write(f"Course: {course.id} — {course.title}")

        # Test serializer directly
        from datetime import datetime, timedelta
        due = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%dT%H:%M")

        test_payloads = [
            {"title": "Test Assignment", "course": course.id, "due_date": due},
            {"title": "Test Assignment", "course": course.id, "due_date": due, "total_marks": 20},
            {"title": "Test Assignment", "course": course.id, "due_date": due + ":00"},
        ]

        for i, payload in enumerate(test_payloads, 1):
            self.stdout.write(f"\nPayload {i}: {payload}")
            s = AssignmentSerializer(data=payload)
            if s.is_valid():
                self.stdout.write(self.style.SUCCESS(f"  ✅ VALID — fields: {list(s.validated_data.keys())}"))
            else:
                self.stdout.write(self.style.ERROR(f"  ❌ INVALID — errors: {s.errors}"))

        # Also show serializer fields
        self.stdout.write(f"\nSerializer fields: {list(AssignmentSerializer().fields.keys())}")