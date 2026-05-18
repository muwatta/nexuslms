from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response

from api.models import Result, ReportCard, User
from api.academics.serializers.result import ResultSerializer
from api.academics.serializers.report_card import ReportCardSerializer


class ParentDashboardViewSet(ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ResultSerializer

    def get_child(self, request):
        return User.objects.filter(
            profile__parent_email=request.user.email
        ).select_related("profile").first()

    def get_queryset(self):
        user = self.request.user

        if not hasattr(user, "profile") or user.profile.role != "parent":
            return Result.objects.none()

        child = self.get_child(self.request)
        if not child:
            return Result.objects.none()

        return Result.objects.filter(student=child.profile)

    @action(detail=False, methods=["get"])
    def child_info(self, request):
        child = self.get_child(request)

        if not child:
            return Response({"detail": "No child linked"}, status=404)

        profile = child.profile

        return Response({
            "id": child.id,
            "full_name": child.get_full_name(),
            "email": child.email,
            "student_id": profile.student_id,
            "class": profile.student_class,
            "department": profile.department,
        })

    @action(detail=False, methods=["get"])
    def report_cards(self, request):
        child = self.get_child(request)

        if not child:
            return Response([])

        report_cards = ReportCard.objects.filter(student=child.profile)
        serializer = ReportCardSerializer(report_cards, many=True)
        return Response(serializer.data)