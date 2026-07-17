# backend/api/permissions.py

from rest_framework.permissions import BasePermission, SAFE_METHODS

ADMIN_ROLES     = frozenset(["admin", "school_admin", "super_admin"])
SUPERADMIN_ROLES = frozenset(["super_admin"])
TEACHER_ROLES   = frozenset(["teacher"])
ALL_STAFF_ROLES = ADMIN_ROLES | TEACHER_ROLES | frozenset(["non_teaching"])


def _get_role(user) -> str:
    if not user or not user.is_authenticated:
        return ""
    if user.is_superuser:
        return "super_admin"
    try:
        return user.profile.role or ""
    except Exception:
        return ""


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return _get_role(request.user) in ADMIN_ROLES


class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return _get_role(request.user) in SUPERADMIN_ROLES


class IsAdminOrTeacher(BasePermission):
    """Allows admins or any teacher."""
    def has_permission(self, request, view):
        role = _get_role(request.user)
        return role in ADMIN_ROLES or role == "teacher"

IsAdminOrInstructor = IsAdminOrTeacher  # backwards compat


class IsTeacher(BasePermission):
    def has_permission(self, request, view):
        return _get_role(request.user) == "teacher"

IsInstructor = IsTeacher  # backwards compat


class IsClassTeacher(BasePermission):
    """Allows class/homeroom teachers (teacher_type == 'class')."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        try:
            p = request.user.profile
            return p.role == "teacher" and p.teacher_type == "class"
        except Exception:
            return False

IsClassInstructor = IsClassTeacher  # backwards compat


class IsSubjectTeacher(BasePermission):
    """Allows subject-specialist teachers (teacher_type == 'subject')."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        try:
            p = request.user.profile
            return p.role == "teacher" and p.teacher_type == "subject"
        except Exception:
            return False

IsSubjectInstructor = IsSubjectTeacher  # backwards compat


class IsAdminOrClassTeacher(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        try:
            p = request.user.profile
            return p.role in ADMIN_ROLES or (
                p.role == "teacher" and p.teacher_type == "class"
            )
        except Exception:
            return False

IsAdminOrClassInstructor = IsAdminOrClassTeacher  # backwards compat


class IsNonTeachingStaff(BasePermission):
    def has_permission(self, request, view):
        return _get_role(request.user) == "non_teaching"


class IsStaff(BasePermission):
    """All staff: admins + teachers + non_teaching."""
    def has_permission(self, request, view):
        return _get_role(request.user) in ALL_STAFF_ROLES


class IsOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        if _get_role(request.user) in ADMIN_ROLES:
            return True
        return getattr(obj, "user", None) == request.user


class IsOwnerOrReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return getattr(obj, "user", None) == request.user


class IsSameDepartment(BasePermission):
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        if _get_role(request.user) in ADMIN_ROLES:
            return True
        try:
            user_dept = request.user.profile.department
        except Exception:
            return False
        obj_dept = (
            getattr(obj, "department", None)
            or getattr(getattr(obj, "student", None), "department", None)
            or getattr(getattr(obj, "profile",  None), "department", None)
            or getattr(getattr(obj, "course",   None), "department", None)
        )
        return user_dept == obj_dept


# ── Helpers ───────────────────────────────────────────────────────────────────

def user_has_role(user, *roles: str) -> bool:
    return _get_role(user) in roles

def user_is_admin(user) -> bool:
    return _get_role(user) in ADMIN_ROLES

def user_is_teacher(user) -> bool:
    return _get_role(user) == "teacher"

user_is_instructor = user_is_teacher  # backwards compat

def user_is_student(user) -> bool:
    return _get_role(user) == "student"

def user_can_manage_department(user, department: str) -> bool:
    role = _get_role(user)
    if role == "super_admin" or getattr(user, "is_superuser", False):
        return True
    if role in ("admin", "school_admin"):
        try:
            return user.profile.department == department
        except Exception:
            return False
    return False

def user_can_access_submission(user, submission) -> bool:
    role = _get_role(user)
    if role in ADMIN_ROLES or getattr(user, "is_superuser", False):
        return True
    try:
        if submission.student.user == user:
            return True
    except Exception:
        pass
    if role == "teacher":
        try:
            sub_dept = (
                getattr(submission, "department", None)
                or submission.quiz.course.department
            )
            return user.profile.department == sub_dept
        except Exception:
            return False
    return False