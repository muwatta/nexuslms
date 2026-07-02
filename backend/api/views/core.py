from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated, AllowAny
from api.permissions import IsAdminOrInstructor, IsOwnerOrAdmin
from rest_framework.response import Response
from rest_framework.decorators import action 
from rest_framework import status
from rest_framework.views import APIView

from api.core.models import Profile
from api.core.constants import get_roles_for_frontend
from api.serializers import ProfileSerializer
from api.serializers.user import UserRegistrationSerializer

from rest_framework.exceptions import PermissionDenied


class ProfileViewSet(ModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer

    def get_permissions(self):
        if self.action == 'list':
            return [IsAuthenticated()]
        if self.action == 'create':
            return [IsAuthenticated(), IsAdminOrInstructor()]
        if self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsOwnerOrAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        user_role = getattr(user, 'role', None)

        try:
            user_profile = Profile.objects.get(user=user)
        except Profile.DoesNotExist:
            user_profile = None

        if user_role in ['admin', 'school_admin', 'super_admin'] or user.is_superuser:
            return qs

        if user_role in ['teacher', 'instructor'] and user_profile:
            return qs.filter(department=user_profile.department)

        if user_role in ['parent', 'student']:
            return qs.filter(user=user)

        return qs.none()

    def perform_create(self, serializer):
        user = self.request.user
        user_role = getattr(user, 'role', None)

        try:
            creator_profile = Profile.objects.get(user=user)
        except Profile.DoesNotExist:
            creator_profile = None

        if user_role in ['admin', 'super_admin'] or (
            user_role == 'instructor' and creator_profile and creator_profile.instructor_type == 'class'
        ):
            serializer.save(
                user=user,
                department=creator_profile.department if creator_profile else 'western'
            )
        else:
            raise PermissionDenied(
                'Not allowed to create profiles. Only class instructors and admins can create student profiles.'
            )

    def perform_update(self, serializer):
        user_role = getattr(self.request.user, 'role', None)

        if user_role != 'admin' and not self.request.user.is_superuser:
            raise PermissionDenied('Only admins can modify profiles')

        instance = serializer.save()

        user_fields = {}
        if 'first_name' in self.request.data:
            user_fields['first_name'] = self.request.data.get('first_name')
        if 'last_name' in self.request.data:
            user_fields['last_name'] = self.request.data.get('last_name')

        if user_fields:
            for attr, val in user_fields.items():
                setattr(instance.user, attr, val)
            instance.user.save()

    def perform_destroy(self, instance):
        user_role = getattr(self.request.user, 'role', None)

        if user_role not in ['admin', 'super_admin']:
            raise PermissionDenied('Only administrators can delete profiles.')

        instance.delete()

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrInstructor])
    def set_password(self, request, pk=None):
        profile = self.get_object()
        pwd = request.data.get('password')

        if not pwd:
            return Response({"error": "Password required"}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user

        try:
            user_profile = user.profile
        except Profile.DoesNotExist:
            return Response({"error": "User profile not found"}, status=status.HTTP_403_FORBIDDEN)

        if user_profile.role == 'instructor' and user_profile.instructor_type == 'class':
            if profile.role != 'student' or profile.department != user_profile.department:
                return Response(
                    {"error": "Class instructors can only modify students in their department"},
                    status=status.HTTP_403_FORBIDDEN
                )
        elif user_profile.role == 'instructor' and user_profile.instructor_type == 'subject':
            return Response(
                {"error": "Subject instructors cannot set passwords"},
                status=status.HTTP_403_FORBIDDEN
            )

        user_obj = profile.user
        user_obj.set_password(pwd)
        user_obj.save()

        return Response({"detail": "Password updated"})


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = UserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        creator = request.user if request.user.is_authenticated else None

        if creator and hasattr(creator, 'role') and creator.role in ['teacher', 'admin', 'instructor']:
            try:
                creator_prof = Profile.objects.get(user=creator)
                prof = user.profile
                prof.department = creator_prof.department
                prof.save()
            except Profile.DoesNotExist:
                pass

        return Response(
            {"id": user.id, "username": user.username, "role": user.role},
            status=status.HTTP_201_CREATED,
        )


# ─────────────────────────────────────────────────────────────────────────────
# ROLES & PERMISSIONS ENDPOINT (single source of truth for frontend)
# ─────────────────────────────────────────────────────────────────────────────

class RolesAndPermissionsView(APIView):
    """
    Serves the canonical definition of roles, permissions, and departments.
    
    Frontend should consume this endpoint instead of hardcoding role/permission
    definitions. This ensures frontend and backend stay in sync.
    
    GET /api/roles-and-permissions/
    
    Returns:
    {
        "roles": [
            {
                "code": "super_admin",
                "label": "Super Admin",
                "permissions": [...]
            },
            ...
        ],
        "departments": [
            {
                "code": "western",
                "label": "Western Education"
            },
            ...
        ]
    }
    """
    
    permission_classes = [AllowAny]  # Public endpoint
    
    def get(self, request, *args, **kwargs):
        return Response(get_roles_for_frontend())
