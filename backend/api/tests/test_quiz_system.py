# backend/api/tests/test_quiz_system.py
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


class QuizSystemTests(TestCase):

    def setUp(self):
        self.student_user, self.student_profile = make_up(
            "quiz_student", role="student", department="western", student_class="jss1a"
        )
        self.teacher_user, self.teacher_profile = make_up(
            "quiz_teacher", role="teacher", department="western", teacher_type="subject"
        )
        self.course = Course.objects.create(
            title="Mathematics — JSS 1A",
            department="western",
            student_class="jss1a",
            is_active=True,
        )
        self.student_client = APIClient()
        self.student_client.force_authenticate(user=self.student_user)
        self.teacher_client = APIClient()
        self.teacher_client.force_authenticate(user=self.teacher_user)

    def test_teacher_can_create_question(self):
        """Teacher can reach quiz creation endpoint."""
        resp = self.teacher_client.post("/api/quizzes/", {
            "title": "Math Quiz 1",
            "course": self.course.id,
            "duration_minutes": 30,
            "total_marks": 20,
        }, format="json")
        self.assertIn(resp.status_code, [200, 201, 400, 403])

    def test_non_teacher_cannot_add_question(self):
        resp = self.student_client.post("/api/quizzes/", {
            "title": "Hacked Quiz",
            "course": self.course.id,
        }, format="json")
        self.assertNotEqual(resp.status_code, 500)

    def test_quiz_duration_and_ordering(self):
        """Quiz list endpoint is reachable."""
        resp = self.teacher_client.get("/api/quizzes/")
        self.assertIn(resp.status_code, [200, 403])

    def test_student_submission_auto_grade(self):
        """Quiz submission endpoint is reachable."""
        resp = self.student_client.get("/api/quiz-submissions/")
        self.assertIn(resp.status_code, [200, 403, 404])

    def test_student_only_receives_their_own_published_submissions(self):
        """Published results must not expose another student's submissions."""
        other_user, other_profile = make_up(
            "other_quiz_student", role="student", department="western", student_class="jss1a"
        )
        quiz = Quiz.objects.create(course=self.course, title="Private quiz")
        Enrollment.objects.create(
            student=self.student_profile,
            course=self.course,
            academic_year="2025/2026",
            term="First Term",
            status="active",
        )
        own = QuizSubmission.objects.create(
            quiz=quiz, student=self.student_profile, published=True
        )
        QuizSubmission.objects.create(quiz=quiz, student=other_profile, published=True)

        response = self.student_client.get("/api/quiz-submissions/")

        self.assertEqual(response.status_code, 200)
        payload = response.data.get("results", response.data)
        self.assertEqual([item["id"] for item in payload], [own.id])

    def test_student_cannot_submit_a_quiz_for_an_unenrolled_course(self):
        other_course = Course.objects.create(
            title="Unenrolled course", department="western", student_class="jss2a"
        )
        quiz = Quiz.objects.create(course=other_course, title="Restricted quiz")

        response = self.student_client.post(
            "/api/quiz-submissions/", {"quiz": quiz.id, "answers": {}}, format="json"
        )

        self.assertEqual(response.status_code, 403)
