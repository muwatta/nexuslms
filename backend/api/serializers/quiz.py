from rest_framework import serializers
from backend.api.core.models import Quiz, QuizSubmission, Question


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ["id", "quiz", "text", "choices", "correct_index", "marks"]
        read_only_fields = ["id"]


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
        validated_data["student"] = self.context["request"].user.profile
        return super().create(validated_data)