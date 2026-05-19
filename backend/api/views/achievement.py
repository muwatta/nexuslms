from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated

from api.core.models import Achievement, Project, Milestone
from api.serializers.achievement import (
    AchievementSerializer,
    ProjectSerializer,
    MilestoneSerializer,
)


class AchievementViewSet(ModelViewSet):
    queryset = Achievement.objects.all()
    serializer_class = AchievementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # students see only their achievements
        if hasattr(user, 'profile') and user.profile.role == 'student':
            return Achievement.objects.filter(student=user.profile)
        return super().get_queryset()


class ProjectViewSet(ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]


class MilestoneViewSet(ModelViewSet):
    queryset = Milestone.objects.all()
    serializer_class = MilestoneSerializer
    permission_classes = [IsAuthenticated]
