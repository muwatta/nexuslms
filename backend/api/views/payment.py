from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, ValidationError

from api.core.models import FeePayment, Profile
from api.serializers import PaymentSerializer
from api.paystack_client import initialize_transaction, verify_transaction
from api.permissions import IsAdmin

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
        
        if user_profile.role in {"admin", "super_admin"}:
            return FeePayment.objects.all()
        if user_profile.role == "school_admin":
            return FeePayment.objects.filter(student__department=user_profile.department)
        return FeePayment.objects.none()

    def get_permissions(self):
        if self.action in {"update", "partial_update", "destroy"}:
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        user_profile = getattr(self.request.user, "profile", None)

        if not user_profile:
            raise PermissionDenied("No profile associated with this user.")

        if user_profile.role != "student":
            raise PermissionDenied("Only students can initiate payments.")
        payment = serializer.save(student=user_profile)

        # if paystack key present and FeePayment is pending, initialize
        if payment.status == "pending" and payment.balance > 0:
            try:
                # use the student's email (or a default)
                email = payment.student.user.email
                if not email:
                    raise ValidationError("An email address is required to initialize payment.")
                init_data = initialize_transaction(
                    amount=payment.balance,
                    email=email,
                    reference=payment.reference,
                )
                payment.paystack_response = init_data
                payment.save(update_fields=["paystack_response"])
            except ValidationError:
                raise
            except Exception as exc:
                raise ValidationError("Unable to initialize payment. Please try again later.") from exc
