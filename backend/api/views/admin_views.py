# backend/api/views/admin_views.py
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status, serializers as drf_serializers
from rest_framework.permissions import IsAuthenticated
from api.pagination import AdminUserPagination
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q

from api.core.models import Profile, AuditLog
from api.permissions import IsAdmin
from .. import signals as signals_module

User = get_user_model()

ADMIN_ROLES = frozenset(["admin", "school_admin", "super_admin"])
SUPER_ROLES = frozenset(["super_admin"])


# ─── Serializers ──────────────────────────────────────────────────────────────
class AdminCreateUserSerializer(drf_serializers.Serializer):
    username        = drf_serializers.CharField(max_length=150)
    password        = drf_serializers.CharField(min_length=6, write_only=True)
    first_name      = drf_serializers.CharField(required=False, allow_blank=True, max_length=150)
    last_name       = drf_serializers.CharField(required=False, allow_blank=True, max_length=150)
    email           = drf_serializers.EmailField(required=False, allow_blank=True)
    role            = drf_serializers.ChoiceField(choices=[
        "student", "parent", "teacher", "instructor",
        "school_admin", "admin", "super_admin",
    ], default="student")
    department      = drf_serializers.ChoiceField(choices=[
        "western", "arabic", "programming",
    ], default="western")
    student_class   = drf_serializers.CharField(required=False, allow_blank=True, max_length=20)
    instructor_type = drf_serializers.ChoiceField(
        choices=["subject", "class", ""], required=False, allow_blank=True
    )
    bio          = drf_serializers.CharField(required=False, allow_blank=True)
    phone        = drf_serializers.CharField(required=False, allow_blank=True, max_length=30)
    address      = drf_serializers.CharField(required=False, allow_blank=True)
    parent_email = drf_serializers.EmailField(required=False, allow_blank=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise drf_serializers.ValidationError("A user with this username already exists.")
        return value

    def validate(self, data):
        role            = data.get("role", "student")
        instructor_type = data.get("instructor_type", "")
        student_class   = data.get("student_class", "")
        department      = data.get("department", "western")

        if role == "instructor" and not instructor_type:
            raise drf_serializers.ValidationError(
                {"instructor_type": "Instructor type is required for instructor role."}
            )
        if role != "instructor" and instructor_type:
            raise drf_serializers.ValidationError(
                {"instructor_type": "Instructor type can only be set for instructor role."}
            )
        if role == "student" and student_class and department:
            valid = [c[0] for c in Profile.get_classes_for_department(department)]
            if student_class not in valid:
                raise drf_serializers.ValidationError(
                    {"student_class": f"'{student_class}' is not valid for {department} department."}
                )
        return data


class AdminUpdateUserSerializer(drf_serializers.Serializer):
    first_name      = drf_serializers.CharField(required=False, allow_blank=True, max_length=150)
    last_name       = drf_serializers.CharField(required=False, allow_blank=True, max_length=150)
    email           = drf_serializers.EmailField(required=False, allow_blank=True)
    role            = drf_serializers.ChoiceField(required=False, choices=[
        "student", "parent", "teacher", "instructor",
        "school_admin", "admin", "super_admin",
    ])
    department      = drf_serializers.ChoiceField(required=False, choices=[
        "western", "arabic", "programming",
    ])
    student_class   = drf_serializers.CharField(required=False, allow_blank=True, max_length=20)
    instructor_type = drf_serializers.ChoiceField(
        choices=["subject", "class", ""], required=False, allow_blank=True
    )
    bio          = drf_serializers.CharField(required=False, allow_blank=True)
    phone        = drf_serializers.CharField(required=False, allow_blank=True, max_length=30)
    address      = drf_serializers.CharField(required=False, allow_blank=True)
    parent_email = drf_serializers.EmailField(required=False, allow_blank=True)
    is_archived  = drf_serializers.BooleanField(required=False)

    def validate(self, data):
        role            = data.get("role")
        instructor_type = data.get("instructor_type", "")
        student_class   = data.get("student_class",   "")
        department      = data.get("department",       "")

        if instructor_type and role and role != "instructor":
            raise drf_serializers.ValidationError(
                {"instructor_type": "Instructor type is only valid for instructor role."}
            )
        if student_class and role and role != "student":
            raise drf_serializers.ValidationError(
                {"student_class": "Student class is only valid for student role."}
            )
        if student_class and department:
            valid = [c[0] for c in Profile.get_classes_for_department(department)]
            if student_class not in valid:
                raise drf_serializers.ValidationError(
                    {"student_class": f"'{student_class}' is not valid for {department} department."}
                )
        return data


class AdminSetPasswordSerializer(drf_serializers.Serializer):
    password = drf_serializers.CharField(min_length=6, write_only=True)

    def validate_password(self, value):
        if value.lower() in ("password", "123456", "qwerty", "admin", "pass"):
            raise drf_serializers.ValidationError("Password is too common.")
        return value


class AdminProfileResponseSerializer(drf_serializers.ModelSerializer):
    user            = drf_serializers.SerializerMethodField()
    teacher_type    = drf_serializers.SerializerMethodField()
    instructor_type = drf_serializers.SerializerMethodField()  # compat alias
    is_archived     = drf_serializers.SerializerMethodField()
    archived_at     = drf_serializers.SerializerMethodField()

    class Meta:
        model  = Profile
        fields = [
            "id", "user", "role", "department", "student_class",
            "teacher_type", "instructor_type",
            "bio", "phone", "address", "parent_email",
            "student_id", "is_archived", "archived_at", "created_at", "updated_at",
        ]

    def get_user(self, obj):
        return {
            "id":         obj.user.id,
            "username":   obj.user.username,
            "email":      obj.user.email      or "",
            "first_name": obj.user.first_name or "",
            "last_name":  obj.user.last_name  or "",
        }

    def get_teacher_type(self, obj):
        return (
            getattr(obj, "teacher_type",    None) or
            getattr(obj, "instructor_type", None) or
            ""
        )

    def get_instructor_type(self, obj):
        return self.get_teacher_type(obj)  # compat alias

    def get_is_archived(self, obj):
        return getattr(obj, "is_archived", False) or False

    def get_archived_at(self, obj):
        val = getattr(obj, "archived_at", None)
        return val.isoformat() if val else None


# ─── Helpers ──────────────────────────────────────────────────────────────────
def _get_caller_role(request) -> str:
    try:
        return request.user.profile.role or ""
    except AttributeError:
        return ""


def _get_client_ip(request) -> str:
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    return xff.split(",")[0].strip() if xff else request.META.get("REMOTE_ADDR", "")


def _log(request, action: str, profile: Profile,
         old_values: dict = None, new_values: dict = None):
    AuditLog.objects.create(
        user       = request.user,
        action     = action,
        model_name = "Profile",
        object_id  = str(profile.pk),
        old_values = old_values,
        new_values = new_values,
        ip_address = _get_client_ip(request),
    )


# ─── AdminUserViewSet ─────────────────────────────────────────────────────────
class AdminUserViewSet(ModelViewSet):
    """
    Full CRUD for user + profile.

    ROLE SCOPING:
      super_admin  → all users, all departments
      admin        → all users
      school_admin → own department only

    FIX #2: swagger_fake_view guard in get_queryset.
    """
    permission_classes = [IsAuthenticated, IsAdmin]
    serializer_class   = AdminProfileResponseSerializer
    pagination_class   = AdminUserPagination

    def get_queryset(self):
        # FIX #2: schema generation guard
        if getattr(self, "swagger_fake_view", False):
            return Profile.objects.none()

        caller_role = _get_caller_role(self.request)
        qs = Profile.objects.select_related("user").order_by("-created_at")

        if caller_role == "school_admin":
            try:
                caller_dept = self.request.user.profile.department
                qs = qs.filter(department=caller_dept)
            except AttributeError:
                return qs.none()

        # ── Query param filters ───────────────────────────────────────────────
        role   = self.request.query_params.get("role",       "")
        dept   = self.request.query_params.get("department", "")
        search = self.request.query_params.get("search",     "").strip()
        # is_archived filter removed — field not yet on Profile model

        if role:
            qs = qs.filter(role=role)

        if dept and caller_role != "school_admin":
            qs = qs.filter(department=dept)

        if search:
            qs = qs.filter(
                Q(user__username__icontains=search)   |
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search)  |
                Q(user__email__icontains=search)      |
                Q(student_id__icontains=search)
            )

        return qs.distinct()

    # ── CREATE ────────────────────────────────────────────────────────────────
    def create(self, request, *args, **kwargs):
        caller_role = _get_caller_role(request)
        ser = AdminCreateUserSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

        d = ser.validated_data

        if caller_role == "school_admin":
            try:
                d["department"] = request.user.profile.department
            except AttributeError:
                pass

        if d.get("role") in ("admin", "super_admin") and caller_role != "super_admin":
            return Response(
                {"detail": "Only super_admin can create admin-level accounts."},
                status=status.HTTP_403_FORBIDDEN,
            )

        with transaction.atomic():
            user = User.objects.create_user(
                username   = d["username"],
                password   = d["password"],
                email      = d.get("email", ""),
                first_name = d.get("first_name", ""),
                last_name  = d.get("last_name",  ""),
            )
            profile = user.profile
            profile.role            = d.get("role",            "student")
            profile.department      = d.get("department",      "western")
            profile.student_class   = d.get("student_class")   or None
            profile.instructor_type = d.get("instructor_type") or None
            profile.bio             = d.get("bio",             "")
            profile.phone           = d.get("phone",           "")
            profile.address         = d.get("address",         "")
            profile.parent_email    = d.get("parent_email",    "")
            profile.save()
            _log(request, "create", profile, new_values={
                "username": user.username, "role": profile.role,
                "department": profile.department,
            })

        return Response(
            AdminProfileResponseSerializer(profile).data,
            status=status.HTTP_201_CREATED,
        )

    # ── PARTIAL UPDATE ────────────────────────────────────────────────────────
    def partial_update(self, request, *args, **kwargs):
        profile     = self.get_object()
        caller_role = _get_caller_role(request)

        if caller_role == "school_admin":
            try:
                if profile.department != request.user.profile.department:
                    return Response(
                        {"detail": "You can only edit users in your own department."},
                        status=status.HTTP_403_FORBIDDEN,
                    )
            except AttributeError:
                pass

        new_role = request.data.get("role")
        if new_role in ("admin", "super_admin") and caller_role != "super_admin":
            return Response(
                {"detail": "Only super_admin can assign admin-level roles."},
                status=status.HTTP_403_FORBIDDEN,
            )

        ser = AdminUpdateUserSerializer(data=request.data, partial=True)
        if not ser.is_valid():
            return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

        d = ser.validated_data

        old_values = {
            "role": profile.role, "department": profile.department,
            "first_name": profile.user.first_name, "last_name": profile.user.last_name,
        }

        with transaction.atomic():
            user       = profile.user
            user_dirty = False
            for field in ("first_name", "last_name", "email"):
                if field in d:
                    setattr(user, field, d.pop(field))
                    user_dirty = True
            if user_dirty:
                user.save()

            for field, value in d.items():
                setattr(
                    profile, field,
                    value if value != "" else None
                    if field in ("student_class", "instructor_type") else value
                )
            profile.save()

            _log(request, "update", profile,
                 old_values=old_values,
                 new_values={"role": profile.role, "department": profile.department})

        return Response(AdminProfileResponseSerializer(profile).data)

    def update(self, request, *args, **kwargs):
        return Response(
            {"detail": "Use PATCH for partial updates."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    # ── DELETE ────────────────────────────────────────────────────────────────
    def destroy(self, request, *args, **kwargs):
        profile     = self.get_object()
        caller_role = _get_caller_role(request)

        if profile.user == request.user:
            return Response(
                {"detail": "You cannot delete your own account."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if caller_role == "school_admin":
            try:
                if profile.department != request.user.profile.department:
                    return Response(
                        {"detail": "You can only delete users in your own department."},
                        status=status.HTTP_403_FORBIDDEN,
                    )
            except AttributeError:
                pass

        if profile.role in ("admin", "super_admin") and caller_role != "super_admin":
            return Response(
                {"detail": "Only super_admin can delete admin accounts."},
                status=status.HTTP_403_FORBIDDEN,
            )

        username = profile.user.username
        _log(request, "delete", profile, old_values={"username": username, "role": profile.role})
        with transaction.atomic():
            profile.user.delete()

        return Response(
            {"detail": f"User '{username}' permanently deleted."},
            status=status.HTTP_200_OK,
        )

    # ── SET PASSWORD ──────────────────────────────────────────────────────────
    @action(detail=True, methods=["post"], url_path="set_password")
    def set_password(self, request, pk=None):
        profile = self.get_object()
        ser = AdminSetPasswordSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
        profile.user.set_password(ser.validated_data["password"])
        profile.user.save()
        _log(request, "update", profile, new_values={"password_changed": True})
        return Response({"detail": "Password updated successfully."})

    # ── ARCHIVE ───────────────────────────────────────────────────────────────
    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        profile = self.get_object()
        if profile.user == request.user:
            return Response({"detail": "You cannot archive your own account."},
                            status=status.HTTP_400_BAD_REQUEST)
        if getattr(profile, "is_archived", False):
            return Response({"detail": "Profile is already archived."},
                            status=status.HTTP_400_BAD_REQUEST)
        if hasattr(profile, "archive"):
            profile.archive(by_user=request.user)
        _log(request, "archive", profile)
        return Response({"detail": "User archived.", "id": profile.id})

    # ── RESTORE ───────────────────────────────────────────────────────────────
    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        profile = self.get_object()
        if not getattr(profile, "is_archived", False):
            return Response({"detail": "Profile is not archived."},
                            status=status.HTTP_400_BAD_REQUEST)
        if hasattr(profile, "restore"):
            profile.restore(by_user=request.user)
        _log(request, "restore", profile)
        return Response({"detail": "User restored.", "id": profile.id})

    # ── STATS ─────────────────────────────────────────────────────────────────
    @action(detail=False, methods=["get"])
    def stats(self, request):
        caller_role = _get_caller_role(request)
        qs = Profile.objects.all()  # is_archived not on model yet

        if caller_role == "school_admin":
            try:
                qs = qs.filter(department=request.user.profile.department)
            except AttributeError:
                return Response({})

        return Response({
            "total":       qs.count(),
            "students":    qs.filter(role="student").count(),
            "instructors": qs.filter(role__in=["instructor", "teacher"]).count(),
            "admins":      qs.filter(role__in=["admin", "super_admin", "school_admin"]).count(),
            "parents":     qs.filter(role="parent").count(),
            "western":     qs.filter(department="western").count(),
            "arabic":      qs.filter(department="arabic").count(),
            "programming": qs.filter(department="programming").count(),
        })


# ─── SyncGroupsView ───────────────────────────────────────────────────────────
class SyncGroupsView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, *args, **kwargs):
        user_ids = request.data.get("user_ids") or []
        if not isinstance(user_ids, (list, tuple)):
            return Response({"detail": "user_ids must be a list"},
                            status=status.HTTP_400_BAD_REQUEST)
        processed, errors = [], []
        for uid in user_ids:
            try:
                user = User.objects.get(pk=uid)
            except User.DoesNotExist:
                errors.append({"id": uid, "error": "not_found"})
                continue
            profile = getattr(user, "profile", None)
            if not profile:
                errors.append({"id": uid, "error": "no_profile"})
                continue
            try:
                signals_module.sync_role_to_groups(type(profile), profile, False)
                processed.append(uid)
            except Exception as exc:
                errors.append({"id": uid, "error": str(exc)})
        return Response({"processed": processed, "errors": errors})