from rest_framework import serializers
from backend.api.core.models import Course, Enrollment, PracticeQuestion


class CourseSerializer(serializers.ModelSerializer):
    """Read-only optimized serializer with computed fields"""
    department_display = serializers.CharField(source='get_department_display', read_only=True)
    instructor_name = serializers.CharField(source='instructor.user.username', read_only=True)
    instructor_id = serializers.IntegerField(source='instructor.id', read_only=True)
    total_students = serializers.SerializerMethodField()
    student_class_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = [
            'id', 'title', 'description', 
            'department', 'department_display', 
            'student_class', 'student_class_display',
            'instructor', 'instructor_id', 'instructor_name',
            'is_active', 'total_students',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_total_students(self, obj):
        """Count active enrollments"""
        return obj.enrollments.filter(status='active').count()
    
    def get_student_class_display(self, obj):
        """Return readable class name or default"""
        if obj.student_class:
            # Try to get display name from Profile choices
            from backend.api.core.models import Profile
            classes = Profile.get_classes_for_department(obj.department)
            class_dict = dict(classes)
            return class_dict.get(obj.student_class, obj.student_class)
        return None


class CourseCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating courses with validation"""
    
    class Meta:
        model = Course
        fields = [
            'id', 'title', 'description',
            'department', 'student_class',
            'instructor', 'is_active'
        ]
    
    def validate_instructor(self, value):
        """Ensure instructor belongs to the course department"""
        if value:
            # Get department from initial data or instance
            department = self.initial_data.get('department')
            if not department and self.instance:
                department = self.instance.department
            
            if department and value.department != department:
                raise serializers.ValidationError(
                    f"Instructor must belong to {dict(Course.DEPARTMENT_CHOICES).get(department, department)} department"
                )
            if value.role != 'instructor':
                raise serializers.ValidationError("Selected user is not an instructor")
        return value
    
    def validate(self, data):
        """Cross-field validation"""
        # Ensure student_class is valid for department
        if data.get('student_class') and data.get('department'):
            from backend.api.core.models import Profile
            valid_classes = [c[0] for c in Profile.get_classes_for_department(data['department'])]
            if data['student_class'] not in valid_classes:
                raise serializers.ValidationError({
                    'student_class': f"Invalid class for {data['department']} department"
                })
        return data


class PracticeQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PracticeQuestion
        fields = "__all__"


class EnrollmentSerializer(serializers.ModelSerializer):
    """Basic enrollment serializer"""
    student_name = serializers.CharField(source='student.user.username', read_only=True)
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)
    course_department = serializers.CharField(source='course.get_department_display', read_only=True)
    
    class Meta:
        model = Enrollment
        fields = [
            'id', 'student', 'student_name', 'student_id',
            'course', 'course_title', 'course_department',
            'academic_year', 'status', 'enrolled_at', 'completed_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['enrolled_at', 'created_at', 'updated_at']


class EnrollmentDetailSerializer(EnrollmentSerializer):
    """Detailed enrollment with full student profile"""
    from .profile import ProfileSerializer
    student_profile = ProfileSerializer(source='student', read_only=True)
    
    class Meta(EnrollmentSerializer.Meta):
        fields = EnrollmentSerializer.Meta.fields + ['student_profile']