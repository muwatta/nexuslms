from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from api.core.models import FeePayment, Profile
from api.serializers import PaymentSerializer
from api.paystack_client import initialize_transaction, verify_transaction

class PaymentViewSet(ModelViewSet):
    """
    ViewSet for handling Payments.
    - Students can only see their own payments.
    - Admins/Instructors can see all payments.
    """
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user_profile = getattr(self.request.user, "profile", None)

        if not user_profile:
            # Safety check
            return FeePayment.objects.none()

        # Students can only see their own FeePayments
        if user_profile.role == "student":
            return FeePayment.objects.filter(student=user_profile)
        
        # Admins/Instructors can see all FeePayments
        return FeePayment.objects.all()

    def perform_create(self, serializer):
        user_profile = getattr(self.request.user, "profile", None)

        if not user_profile:
            raise PermissionDenied("No profile associated with this user.")

        # Students can only create FeePayments for themselves
        if user_profile.role == "student":
            FeePayment = serializer.save(student=user_profile)
        else:
            FeePayment = serializer.save()

        # if paystack key present and FeePayment is pending, initialize
        if FeePayment.status == "pending":
            try:
                # use the student's email (or a default)
                email = FeePayment.student.user.email or "no-reply@example.com"
                init_data = initialize_transaction(
                    amount=FeePayment.amount,
                    email=email,
                    reference=FeePayment.reference,
                )
                # store paystack response in an attribute for debugging
                FeePayment.paystack_response = init_data
                FeePayment.save()
            except Exception:
                # swallow exceptions so API call still works
                pass
