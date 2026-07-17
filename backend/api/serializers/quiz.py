from rest_framework import serializers
from api.core.models import Quiz, QuizSubmission, Question


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ["id", "quiz", "text", "choices", "correct_index", "marks"]
        read_only_fields = ["id"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        profile = getattr(getattr(request, "user", None), "profile", None)
        if profile and profile.role == "student":
            data.pop("correct_index", None)
        return data


class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = [
            "id",
            "course",
            "title",
            "description",
            "total_marks",
            "created_at",
            "updated_at",
            "questions",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

class QuizSubmissionSerializer(serializers.ModelSerializer):
    student = serializers.PrimaryKeyRelatedField(
        read_only=True, default=serializers.CurrentUserDefault()
    )

    class Meta:
        model = QuizSubmission
        fields = ["id", "quiz", "student", "answers", "score", "published", "submitted_at", "created_at"]
        read_only_fields = ["id", "score", "published", "submitted_at", "created_at"]

    def create(self, validated_data):
        try:
            validated_data["student"] = self.context["request"].user.profile
        except Exception:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("User profile not found")
        return super().create(validated_data)
