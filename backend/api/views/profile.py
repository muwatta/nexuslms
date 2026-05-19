# backend/api/views/profile.py
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone

from api.core.models import Profile, Enrollment, InstructorAssignment, AuditLog
from api.serializers.profile import (
    ProfileSerializer, ProfileCreateUpdateSerializer,
    InstructorAssignmentSerializer, EnrollmentSerializer,
    AuditLogSerializer, ArchiveRestoreSerializer, PromoteStudentSerializer,
)
from api.permissions import IsAdminOrInstructor, IsAdmin


def _safe_role(user) -> str:
    """Return the user's profile role without raising."""
    try:
        return user.profile.role or ""
    except AttributeError:
        return ""


class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.select_related("user").all()
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]
    filter_backends   = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields  = ["role", "department", "student_class", "teacher_type"]
    search_fields     = ["user__username", "user__email", "student_id", "phone"]
    ordering_fields   = ["created_at", "user__username"]
    ordering          = ["-created_at"]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return ProfileCreateUpdateSerializer
        return ProfileSerializer

    def get_queryset(self):
        # FIX #2: guard for schema generation and unauthenticated requests
        if getattr(self, "swagger_fake_view", False):
            return Profile.objects.none()

        user = self.request.user
        if not user or not user.is_authenticated:
            return Profile.objects.none()

        role = _safe_role(user)
        queryset = Profile.objects.select_related("user").all()

        if role == "super_admin":
            return queryset
        if role == "school_admin":
            return queryset.filter(department=user.profile.department)
        if role in ("instructor", "teacher"):
            # Teachers can see all students in their department
            # (needed for result entry — they need to see all students in a class)
            dept = getattr(user.profile, "department", None)
            if dept:
                return queryset.filter(department=dept)
            # Fallback: assigned classes only
            assigned_classes = InstructorAssignment.objects.filter(
                instructor=user.profile, is_active=True
            ).values_list("student_class", flat=True)
            if assigned_classes:
                return queryset.filter(
                    student_class__in=assigned_classes, role="student"
                )
            return queryset.filter(department=user.profile.department) if hasattr(user, "profile") else queryset.none()
        # admin role (without super_/school_ prefix) — full access
        if role == "admin":
            return queryset
        # Students/parents/others: own profile only
        return queryset.filter(user=user)

    def get_object(self):
        """
        FIX #3: IDOR protection.
        Non-admin users can only retrieve/edit their own profile.
        """
        obj = super().get_object()
        user = self.request.user
        role = _safe_role(user)

        admin_roles = {"super_admin", "admin", "school_admin"}
        if role in admin_roles:
            return obj  # admins can access any profile
        if role == "instructor":
            # Instructors can read (but not write) student profiles in their scope.
            # Write actions are blocked — they must go through AdminUserViewSet.
            if self.request.method not in ("GET", "HEAD", "OPTIONS"):
                if obj.user != user:
                    raise PermissionDenied("Instructors cannot edit other users' profiles.")
            return obj
        # Students/parents: own profile only
        if obj.user != user:
            raise PermissionDenied("You can only access your own profile.")
        return obj

    # ── GET /profiles/me/ ────────────────────────────────────────────────────
    @action(detail=False, methods=["get"])
    def me(self, request):
        profile    = request.user.profile
        serializer = ProfileSerializer(profile)
        return Response(serializer.data)

    # ── PATCH /profiles/update_me/ ───────────────────────────────────────────
    @action(detail=False, methods=["patch"], url_path="update_me")
    def update_me(self, request):
        """
        Update BOTH user fields (first_name, last_name, email) AND profile
        fields in one request. Role/department changes are blocked here —
        those go through AdminUserViewSet.
        """
        profile    = request.user.profile
        serializer = ProfileCreateUpdateSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ProfileSerializer(profile).data)

    # ── Archive / Restore / Promote ──────────────────────────────────────────
    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsAdmin])
    def archive(self, request, pk=None):
        profile    = self.get_object()
        serializer = ArchiveRestoreSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile.archive(by_user=request.user)
        return Response({
            "status":      "archived",
            "archived_at": profile.archived_at,
            "message":     "Profile archived successfully",
        })

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsAdmin])
    def restore(self, request, pk=None):
        profile = self.get_object()
        if not getattr(profile, "is_archived", False):
            return Response({"error": "Profile is not archived"}, status=status.HTTP_400_BAD_REQUEST)
        if hasattr(profile, "restore"):
            profile.restore(by_user=request.user)
        return Response({"status": "restored", "message": "Profile restored successfully"})

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsAdminOrInstructor])
    def promote(self, request, pk=None):
        profile = self.get_object()
        if profile.role != "student":
            return Response({"error": "Only students can be promoted"}, status=status.HTTP_400_BAD_REQUEST)
        serializer = PromoteStudentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        current_enrollment = Enrollment.objects.filter(student=profile, status="active").first()
        if not current_enrollment:
            return Response({"error": "No active enrollment found"}, status=status.HTTP_400_BAD_REQUEST)
        from api.core.models import Course
        try:
            next_course = Course.objects.get(id=serializer.validated_data["next_course_id"])
        except Course.DoesNotExist:
            return Response({"error": "Next course not found"}, status=status.HTTP_404_NOT_FOUND)
        new_enrollment = current_enrollment.promote_to(next_course=next_course, by_user=request.user)
        academic_year  = serializer.validated_data.get("academic_year")
        if academic_year:
            new_enrollment.academic_year = academic_year
            new_enrollment.save()
        return Response({
            "status":         "promoted",
            "new_enrollment": EnrollmentSerializer(new_enrollment).data,
        })

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated, IsAdmin])
    def archived(self, request):
        # is_archived not yet on Profile model — return empty until migration applied
        queryset = Profile.objects.none()
        role     = _safe_role(request.user)
        if role == "school_admin":
            queryset = queryset.filter(department=request.user.profile.department)
        page = self.paginate_queryset(queryset)
        if page is not None:
            return self.get_paginated_response(ProfileSerializer(page, many=True).data)
        return Response(ProfileSerializer(queryset, many=True).data)


class InstructorAssignmentViewSet(viewsets.ModelViewSet):
    """
    FIX #2: swagger_fake_view guard added.
    """
    queryset = InstructorAssignment.objects.select_related(
        "instructor", "instructor__user", "subject", "assigned_by"
    ).all()
    serializer_class   = InstructorAssignmentSerializer
    permission_classes = [IsAuthenticated, IsAdminOrInstructor]
    filterset_fields   = ["instructor", "subject", "student_class", "is_active"]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return InstructorAssignment.objects.none()
        return super().get_queryset()

    def perform_create(self, serializer):
        serializer.save(assigned_by=self.request.user)


class EnrollmentViewSet(viewsets.ModelViewSet):
    """
    FIX #2: swagger_fake_view guard added.
    """
    queryset = Enrollment.objects.select_related(
        "student", "student__user", "course"
    ).all()
    serializer_class   = EnrollmentSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields   = ["student", "course", "academic_year", "status"]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Enrollment.objects.none()

        user = self.request.user
        if not user or not user.is_authenticated:
            return Enrollment.objects.none()

        role = _safe_role(user)
        if role in ("admin", "school_admin", "super_admin"):
            return self.queryset
        if role == "instructor":
            assigned_classes = InstructorAssignment.objects.filter(
                instructor=user.profile, is_active=True
            ).values_list("student_class", flat=True)
            return self.queryset.filter(student__student_class__in=assigned_classes)
        return self.queryset.filter(student=user.profile)


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ReadOnlyModelViewSet — POST/PUT/DELETE are blocked at the viewset level.
    FIX #4: confirmed read-only; frontend audit-log POST call returns 405.
    FIX #2: swagger_fake_view guard added.
    """
    queryset           = AuditLog.objects.select_related("user").all()
    serializer_class   = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filterset_fields   = ["action", "model_name", "user", "timestamp"]
    ordering           = ["-timestamp"]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return AuditLog.objects.none()

        queryset   = super().get_queryset()
        start_date = self.request.query_params.get("start_date")
        end_date   = self.request.query_params.get("end_date")
        if start_date:
            queryset = queryset.filter(timestamp__gte=start_date)
        if end_date:
            queryset = queryset.filter(timestamp__lte=end_date)
        return queryset