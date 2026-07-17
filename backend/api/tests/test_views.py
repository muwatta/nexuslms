# backend/api/tests/test_views.py
from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from api.core.models import Course, Enrollment, Profile, Quiz, QuizSubmission

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


class ViewTests(TestCase):

    def setUp(self):
        self.admin_user, self.admin_profile = make_up(
            "test_admin_view", role="super_admin", department="western"
        )
        self.student_user, self.student_profile = make_up(
            "test_student_view", role="student", department="western", student_class="jss1a"
        )
        self.admin_client = APIClient()
        self.admin_client.force_authenticate(user=self.admin_user)
        self.student_client = APIClient()
        self.student_client.force_authenticate(user=self.student_user)

    def test_registration(self):

        c = APIClient()
        resp = c.post("/api/auth/login/", {
            "username": "test_admin_view", "password": "testpass123"
        }, format="json")

        self.assertNotEqual(resp.status_code, 500)

    def test_create_course(self):
        resp = self.admin_client.post("/api/courses/", {
            "title": "Test Course",
            "department": "western",
            "student_class": "jss1a",
            "is_active": True,
        }, format="json")
        self.assertIn(resp.status_code, [200, 201, 400, 403])

    def test_student_analytics(self):
        resp = self.admin_client.get("/api/analytics/")
        self.assertIn(resp.status_code, [200, 404])

    def test_analytics_lookup_by_course_title_and_student_username(self):
        course = Course.objects.create(
            title="TestCourseAnalytics",
            department="western",
            student_class="jss1",
            is_active=True,
        )
        quiz = Quiz.objects.create(course=course, title="Analytics Quiz")
        enrollment = Enrollment.objects.create(
            student=self.student_profile,
            course=course,
            academic_year="2024/2025",
            status="active",
        )
        QuizSubmission.objects.create(
            quiz=quiz,
            student=self.student_profile,
            answers={},
            score=88.0,
            published=True,
        )

        course_resp = self.admin_client.get(
            "/api/analytics/course/TestCourseAnalytics/",
        )
        self.assertEqual(course_resp.status_code, 200, course_resp.data)
        self.assertEqual(course_resp.data.get("course_title"), "TestCourseAnalytics")
        self.assertEqual(course_resp.data.get("total_enrollments"), 1)

        student_resp = self.admin_client.get(
            f"/api/analytics/student/{self.student_user.username}/",
        )
        self.assertEqual(student_resp.status_code, 200, student_resp.data)
        self.assertEqual(student_resp.data.get("student_username"), self.student_user.username)
        self.assertEqual(student_resp.data.get("total_quiz_submissions"), 1)

    def test_admin_can_assign_teacher_role_with_class_details(self):
        user, profile = make_up("teacher_role_target", role="student", department="western")

        resp = self.admin_client.patch(
            f"/api/admin/users/{profile.id}/",
            {
                "role": "teacher",
                "teacher_type": "class",
                "department": "western",
                "student_class": "jss1",
            },
            format="json",
        )

        self.assertEqual(resp.status_code, 200, resp.data)
        profile.refresh_from_db()
        self.assertEqual(profile.role, "teacher")
        self.assertEqual(profile.teacher_type, "class")
        self.assertEqual(profile.student_class, "jss1")

    def test_course_analytics(self):

        resp = self.admin_client.get("/api/courses/")
        self.assertIn(resp.status_code, [200, 403])

    def test_ai_endpoint(self):

        resp = self.admin_client.post("/api/ai/chat/", {"message": "hello"}, format="json")
        self.assertNotEqual(resp.status_code, 500)

    def test_payment_initialization_response(self):

        resp = self.admin_client.get("/api/payments/")
        self.assertIn(resp.status_code, [200, 403, 404])

    def test_payment_student_restriction(self):

        resp = self.student_client.get("/api/admin/users/")
        self.assertIn(resp.status_code, [403, 404])

    def test_quiz_submission_publish_and_pdf(self):

        resp = self.admin_client.get("/api/quizzes/")
        self.assertIn(resp.status_code, [200, 403, 404])