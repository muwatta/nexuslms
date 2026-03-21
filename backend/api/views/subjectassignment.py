# backend/api/views/subjectassignment_views.py
#
# REST endpoints for SubjectAssignment.
#
#   GET    /api/subject-assignments/              → list (admin sees all; teacher sees own; student sees own)
#   POST   /api/subject-assignments/              → create (admin only)
#   GET    /api/subject-assignments/{id}/         → retrieve
#   PATCH  /api/subject-assignments/{id}/         → update (admin only; marks is_auto_assigned=False)
#   DELETE /api/subject-assignments/{id}/         → delete (admin only)
#
#   GET    /api/subject-assignments/my_subjects/  → current student: list their teacher assignments
#   GET    /api/subject-assignments/my_students/  → current teacher: list their students per subject
#
# ─────────────────────────────────────────────────────────────────────────────

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.permissions import IsAdmin, ADMIN_ROLES
from api.models.subjectassignment import SubjectAssignment
from api.serializers.profile import SubjectAssignmentSerializer


class SubjectAssignmentViewSet(viewsets.ModelViewSet):
    serializer_class   = SubjectAssignmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, "is_superuser", False):
            return SubjectAssignment.objects.all().select_related(
                "student", "teacher", "teacher__profile"
            )

        try:
            role = user.profile.role
        except AttributeError:
            return SubjectAssignment.objects.none()

        if role in ADMIN_ROLES:
            # School admins see their own department only
            if role == "school_admin":
                dept = user.profile.department
                return SubjectAssignment.objects.filter(
                    teacher__profile__department=dept
                ).select_related("student", "teacher", "teacher__profile")
            return SubjectAssignment.objects.all().select_related(
                "student", "teacher", "teacher__profile"
            )

        if role == "teacher":
            return SubjectAssignment.objects.filter(
                teacher=user
            ).select_related("student", "teacher", "teacher__profile")

        if role == "student":
            return SubjectAssignment.objects.filter(
                student=user
            ).select_related("student", "teacher", "teacher__profile")

        if role == "parent":
            # Parents see assignments for their children
            # (assuming parent_email linkage — simplified: same department)
            return SubjectAssignment.objects.filter(
                student__profile__parent_email=user.email
            ).select_related("student", "teacher", "teacher__profile")

        return SubjectAssignment.objects.none()

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAdmin()]
        return [IsAuthenticated()]

    def perform_update(self, serializer):
        # Any manual update by admin sets is_auto_assigned=False
        serializer.save(is_auto_assigned=False)

    # ── Custom actions ─────────────────────────────────────────────────────────

    @action(detail=False, methods=["get"], url_path="my_subjects")
    def my_subjects(self, request):
        """Student/parent: list subjects with their assigned teacher."""
        user = request.user
        qs = SubjectAssignment.objects.filter(
            student=user
        ).select_related("teacher", "teacher__profile").order_by("subject")

        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="my_students")
    def my_students(self, request):
        """Teacher: list their assigned students grouped by subject."""
        user = request.user
        try:
            if user.profile.role != "teacher":
                return Response({"detail": "Not a teacher."}, status=403)
        except AttributeError:
            return Response({"detail": "Profile missing."}, status=403)

        qs = SubjectAssignment.objects.filter(
            teacher=user
        ).select_related("student", "student__profile").order_by("subject", "student__username")

        # Group by subject
        grouped: dict = {}
        for sa in qs:
            key = sa.subject
            if key not in grouped:
                grouped[key] = {
                    "subject":  sa.subject,
                    "subject_display": sa.get_subject_display(),
                    "students": [],
                }
            p = getattr(sa.student, "profile", None)
            fn = f"{sa.student.first_name} {sa.student.last_name}".strip() or sa.student.username
            grouped[key]["students"].append({
                "id":            sa.student.id,
                "username":      sa.student.username,
                "full_name":     fn,
                "student_id":    getattr(p, "student_id", "") or "",
                "class":         getattr(p, "student_class", None),
                "class_section": getattr(p, "class_section", "") or "",
                "department":    getattr(p, "department", None),
                "assignment_id": sa.id,
            })

        return Response(list(grouped.values()))