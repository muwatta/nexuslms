from rest_framework import serializers
from backend.api.core.models import Assignment, AssignmentSubmission


class AssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = "__all__"


class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssignmentSubmission
        fields = "__all__"
        read_only_fields = ("published",)
