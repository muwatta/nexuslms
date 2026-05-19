from rest_framework import serializers
from api.core.models import FeePayment


class PaymentSerializer(serializers.ModelSerializer):
    paystack_response = serializers.JSONField(read_only=True)

    class Meta:
        model = FeePayment
        fields = "__all__"
        read_only_fields = ("paystack_response",)
