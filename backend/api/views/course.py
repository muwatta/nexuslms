# backend/api/views/course.py

from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from api.core.models import Course, PracticeQuestion
from api.serializers import CourseSerializer, PracticeQuestionSerializer
from api.permissions import IsAdminOrInstructor
from api.filters import CourseFilter
from api.pdf_utils import generate_course_syllabus_pdf


class CourseViewSet(ModelViewSet):
    queryset           = Course.objects.all()
    serializer_class   = CourseSerializer
    permission_classes = [IsAuthenticated, IsAdminOrInstructor]
    filterset_class    = CourseFilter

    def get_queryset(self):
        user = self.request.user

        # ── Get role and profile ──────────────────────────────────────────────
        try:
            profile = user.profile
            role    = profile.role
        except Exception:
            if user.is_superuser:
                return Course.objects.all()
            return Course.objects.none()

        qs = Course.objects.select_related("instructor__user")

        # ── Admins and school admins ──────────────────────────────────────────
        ADMIN_ROLES = {"admin", "school_admin", "super_admin"}
        if role in ADMIN_ROLES or user.is_superuser:
            # School admins scoped to their dept; others see everything
            # CourseFilter will apply ?department= on top
            if role == "school_admin":
                dept = getattr(profile, "department", None)
                if dept:
                    qs = qs.filter(department=dept)
            return qs

        # ── Teachers ─────────────────────────────────────────────────────────
        if role in ("teacher", "instructor"):
            dept = getattr(profile, "department", None)
            if dept:
                # Scope to teacher's department — CourseFilter applies ?student_class= on top
                return qs.filter(department=dept)
            # Teacher has no department set — return all active courses
            return qs.filter(is_active=True)

        # ── Students ─────────────────────────────────────────────────────────
        if role == "student":
            return qs.filter(enrollments__student=profile).distinct()

        # ── Everyone else ────────────────────────────────────────────────────
        return Course.objects.none()

    @action(detail=True, methods=['get'], url_path='syllabus/pdf')
    def syllabus_pdf(self, request, pk=None):
        course = self.get_object()
        return generate_course_syllabus_pdf(course)


class PracticeQuestionViewSet(ModelViewSet):
    queryset           = PracticeQuestion.objects.all()
    serializer_class   = PracticeQuestionSerializer
    permission_classes = [IsAuthenticated]