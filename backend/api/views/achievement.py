from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated

from api.core.models import Achievement, Project, Milestone
from api.serializers.achievement import (
    AchievementSerializer,
    ProjectSerializer,
    MilestoneSerializer,
)
from api.permissions import IsAdminOrTeacher


def accessible_course_content(user, model):
    profile = getattr(user, "profile", None)
    if not profile:
        return model.objects.none()
    if user.is_superuser or profile.role in {"admin", "super_admin"}:
        return model.objects.all()
    if profile.role in {"school_admin", "teacher"}:
        return model.objects.filter(course__department=profile.department)
    if profile.role == "student":
        return model.objects.filter(course__enrollments__student=profile, course__enrollments__status="active").distinct()
    return model.objects.none()


class AchievementViewSet(ModelViewSet):
    queryset = Achievement.objects.all()
    serializer_class = AchievementSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update", "destroy"}:
            return [IsAuthenticated(), IsAdminOrTeacher()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        # students see only their achievements
        if hasattr(user, 'profile') and user.profile.role == 'student':
            return Achievement.objects.filter(student=user.profile)
        if hasattr(user, "profile") and user.profile.role in {"school_admin", "teacher"}:
            return Achievement.objects.filter(course__department=user.profile.department)
        if getattr(user, "is_superuser", False) or (hasattr(user, "profile") and user.profile.role in {"admin", "super_admin"}):
            return super().get_queryset()
        return Achievement.objects.none()


class ProjectViewSet(ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update", "destroy"}:
            return [IsAuthenticated(), IsAdminOrTeacher()]
        return [IsAuthenticated()]

    def get_queryset(self):
        return accessible_course_content(self.request.user, Project)


class MilestoneViewSet(ModelViewSet):
    queryset = Milestone.objects.all()
    serializer_class = MilestoneSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update", "destroy"}:
            return [IsAuthenticated(), IsAdminOrTeacher()]
        return [IsAuthenticated()]

    def get_queryset(self):
        return accessible_course_content(self.request.user, Milestone)
