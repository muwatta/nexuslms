# backend/api/views/permissions_view.py

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


ROLE_PERMISSIONS: dict[str, list[str]] = {
    "super_admin": [
        "view_all_departments", "manage_users", "manage_courses",
        "manage_enrollments", "view_audit_logs", "manage_admins",
        "view_analytics", "manage_payments", "manage_settings",
        "manage_subjects", "manage_teachers",
    ],
    "admin": [
        "manage_users", "manage_courses", "manage_enrollments",
        "view_audit_logs", "view_analytics",
        "manage_subjects", "manage_teachers",
    ],
    "school_admin": [
        "manage_users", "manage_courses", "manage_enrollments",
        "view_analytics", "manage_subjects",
    ],
    "teacher": [
        "view_students", "manage_assignments", "manage_results",
        "view_courses", "view_subject_assignments",
    ],
    "non_teaching": [
        "view_students", "view_courses",
    ],
    "student": [
        "view_courses", "view_assignments", "view_results",
        "submit_assignments", "view_my_teachers",
    ],
    "parent": [
        "view_results", "view_courses", "view_my_children_teachers",
    ],
    "visitor": [
        "view_courses",
    ],
}


class PermissionsMeView(APIView):
    """
    GET /api/permissions/me/
    Returns the current user's role and computed permissions list.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        role         = ""
        department   = ""
        teacher_type = ""

        try:
            profile      = user.profile
            role         = profile.role         or ""
            department   = profile.department   or ""
            # Support both old instructor_type and new teacher_type field
            teacher_type = (
                getattr(profile, "teacher_type", None)
                or getattr(profile, "instructor_type", None)
                or ""
            )
        except Exception:
            pass

        if user.is_superuser and role != "super_admin":
            role = "super_admin"

        return Response({
            "role":         role,
            "department":   department,
            "teacher_type": teacher_type,
            # Keep instructor_type in response for FE backwards compatibility
            "instructor_type": teacher_type,
            "permissions":  ROLE_PERMISSIONS.get(role, []),
            "is_staff":     user.is_staff,
            "is_superuser": user.is_superuser,
        })