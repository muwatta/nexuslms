from rest_framework import serializers
from api.models import ReportCard


class ReportCardSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportCard
        fields = "__all__"