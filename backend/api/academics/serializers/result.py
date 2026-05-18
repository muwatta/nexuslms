from rest_framework import serializers
from api.models import Result


class ResultSerializer(serializers.ModelSerializer):
    student_name     = serializers.SerializerMethodField()
    course_title     = serializers.SerializerMethodField()
    entered_by_name  = serializers.SerializerMethodField()
    ca_total         = serializers.FloatField(read_only=True)

    class Meta:
        model = Result
        fields = [
            "id", "student", "student_name", "course", "course_title",
            "term", "academic_year", "student_class",
            "test1", "test2", "assignment", "midterm", "exam",
            "ca_total", "total", "grade", "position", "remark",
            "status", "entered_by", "entered_by_name",
            "submitted_at", "reviewed_at", "published_at",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "total", "grade", "ca_total", "position",
            "submitted_at", "reviewed_at", "published_at",
            "created_at", "updated_at",
        ]

    def get_student_name(self, obj):
        u = obj.student.user
        return f"{u.first_name} {u.last_name}".strip() or u.username

    def get_course_title(self, obj):
        return obj.course.title

    def get_entered_by_name(self, obj):
        if not obj.entered_by:
            return None
        u = obj.entered_by.user
        return f"{u.first_name} {u.last_name}".strip() or u.username


class ResultWriteSerializer(serializers.ModelSerializer):
    """Used for creating/updating results (teacher entry)."""

    class Meta:
        model = Result
        fields = [
            "student", "course", "term", "academic_year",
            "test1", "test2", "assignment", "midterm", "exam",
            "remark",
        ]

    def validate(self, data):
        errors = {}
        for field, max_val in [
            ("test1", 10), ("test2", 10),
            ("assignment", 10), ("midterm", 10), ("exam", 60),
        ]:
            val = data.get(field, 0)
            if val < 0 or val > max_val:
                errors[field] = f"Must be between 0 and {max_val}."
        if errors:
            raise serializers.ValidationError(errors)
        return data


class BulkResultSerializer(serializers.Serializer):
    """For bulk entry — list of result records for a course/term."""

    course        = serializers.IntegerField()
    term          = serializers.CharField()
    academic_year = serializers.CharField()
    results       = serializers.ListField(
        child=serializers.DictField(),
        min_length=1,
    )
