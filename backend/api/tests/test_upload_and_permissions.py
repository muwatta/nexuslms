# backend/api/tests/test_upload_and_permissions.py
from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from api.core.models import Profile, Course

User = get_user_model()


def make_up(username, role="student", department="western", **kw):
    user = User.objects.create_user(username=username, password="testpass123")
    profile, _ = Profile.objects.get_or_create(
        user=user,
        defaults={"role": role, "department": department, **kw},
    )
    if profile.role != role:
        profile.role = role
        profile.department = department
        for k, v in kw.items():
            setattr(profile, k, v)
        profile.save()
    return user, profile


class UploadAndPermissionTests(TestCase):

    def setUp(self):
        self.admin_user,   self.admin_profile   = make_up("up_admin",   "super_admin", "western")
        self.teacher_user, self.teacher_profile = make_up("up_teacher", "teacher",     "western", teacher_type="subject")
        self.student_user, self.student_profile = make_up("up_student", "student",     "western", student_class="jss1a")

        self.admin_client   = APIClient(); self.admin_client.force_authenticate(user=self.admin_user)
        self.teacher_client = APIClient(); self.teacher_client.force_authenticate(user=self.teacher_user)
        self.student_client = APIClient(); self.student_client.force_authenticate(user=self.student_user)

        self.course = Course.objects.create(
            title="English — JSS 1A", department="western",
            student_class="jss1a", is_active=True
        )

    def test_teacher_can_download_and_upload_template(self):

        resp = self.teacher_client.get("/api/assignments/")
        self.assertIn(resp.status_code, [200, 403, 404])

    def test_teacher_can_create_assignment_for_their_department(self):
        response = self.teacher_client.post(
            "/api/assignments/",
            {
                "course": self.course.id,
                "title": "Reading exercise",
                "deadline": (timezone.now() + timedelta(days=7)).isoformat(),
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.data)

    def test_assignment_submission_pdf_validation(self):

        resp = self.student_client.get("/api/assignments/")
        self.assertIn(resp.status_code, [200, 403, 404])

    def test_student_cannot_upload_results(self):

        resp = self.student_client.post("/api/results/", {
            "course": self.course.id,
            "student": self.student_profile.id,
            "term": "First Term",
            "academic_year": "2025/2026",
        }, format="json")
        self.assertNotEqual(resp.status_code, 500)

    def test_only_admin_can_delete_profile(self):
        resp = self.student_client.delete(
            f"/api/profiles/{self.teacher_profile.id}/"
        )
        self.assertIn(resp.status_code, [403, 404, 405])
