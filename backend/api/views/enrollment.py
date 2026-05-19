from rest_framework import viewsets, permissions, serializers
from rest_framework.exceptions import ValidationError
from api.core.models import Enrollment, Profile
from api.serializers import EnrollmentSerializer

class IsStudent(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.profile.role == 'student'

class IsInstructor(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.profile.role == 'instructor'

class EnrollmentViewSet(viewsets.ModelViewSet):
    serializer_class = EnrollmentSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAuthenticated()]  # Any logged-in user can enroll
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        user_profile = self.request.user.profile
        
        # Instructors see enrollments for their courses
        if user_profile.role == 'instructor':
            return Enrollment.objects.filter(course__instructor=user_profile)
        
        # Students see only their own enrollments
        return Enrollment.objects.filter(student=user_profile)
    
    def perform_create(self, serializer):
        user_profile = self.request.user.profile
        
        # Auto-set student to current user
        if user_profile.role != 'student':
            raise ValidationError("Only students can enroll in courses")
        
        # Check if already enrolled (handled by DB constraint, but catch it gracefully)
        course = serializer.validated_data['course']
        if Enrollment.objects.filter(student=user_profile, course=course).exists():
            raise ValidationError("Already enrolled in this course")
        
        serializer.save(student=user_profile, status='active')