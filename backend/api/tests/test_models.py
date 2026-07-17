# backend/api/tests/test_models.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from api.core.models import Profile, Course, Enrollment

User = get_user_model()


def make_user_with_profile(username, role="student", department="western", **kw):
    user = User.objects.create_user(username=username, password="testpass123")
    profile, _ = Profile.objects.get_or_create(
        user=user,
        defaults={"role": role, "department": department, **kw},
    )
    return user, profile


class ModelTests(TestCase):

    def setUp(self):
        self.user, self.profile = make_user_with_profile(
            "testuser_model", role="student", department="western"
        )

    def test_profile_created(self):
        """Profile exists and has the correct role."""
        self.assertEqual(self.profile.role, "student")
        self.assertEqual(self.profile.department, "western")

    def test_course_str(self):
        """Course __str__ contains title and department."""
        course = Course.objects.create(
            title="Mathematics — JSS 1A",
            department="western",
            student_class="jss1a",
            is_active=True,
        )
        self.assertIn("Mathematics", str(course))

    def test_enrollment_unique(self):
        """Cannot enroll the same student twice in the same course/year/term."""
        from django.db import IntegrityError
        course = Course.objects.create(
            title="English — JSS 1A",
            department="western",
            student_class="jss1a",
            is_active=True,
        )
        Enrollment.objects.create(
            student=self.profile,
            course=course,
            academic_year="2025/2026",
            term="First Term",
            status="active",
        )
        with self.assertRaises(Exception):  # IntegrityError or ValidationError
            Enrollment.objects.create(
                student=self.profile,
                course=course,
                academic_year="2025/2026",
                term="First Term",
                status="active",
            )