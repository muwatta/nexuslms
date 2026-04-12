from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from api.models import User, Result, ReportCard
from api.serializers import ResultSerializer, ReportCardSerializer

class ParentDashboardViewSet(ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ResultSerializer

    def get_queryset(self):
        # Only parents can access
        if self.request.user.profile.role != 'parent':
            return Result.objects.none()
        # Get the child linked via parent_email on the child's profile
        child = User.objects.filter(profile__parent_email=self.request.user.email).first()
        if not child:
            return Result.objects.none()
        return Result.objects.filter(student=child.profile)

    @action(detail=False, methods=['get'], url_path='child-info')
    def child_info(self, request):
        child = User.objects.filter(profile__parent_email=request.user.email).first()
        if not child:
            return Response({'error': 'No child linked'}, status=404)
        return Response({
            'id': child.id,
            'full_name': child.get_full_name(),
            'email': child.email,
            'student_id': child.profile.student_id,
            'class': child.profile.student_class,
            'department': child.profile.department,
        })

    @action(detail=False, methods=['get'], url_path='report-cards')
    def report_cards(self, request):
        child = User.objects.filter(profile__parent_email=request.user.email).first()
        if not child:
            return Response([])
        report_cards = ReportCard.objects.filter(student=child.profile)
        serializer = ReportCardSerializer(report_cards, many=True)
        return Response(serializer.data)