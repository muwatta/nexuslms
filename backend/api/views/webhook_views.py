import hashlib
import hmac
import json
import logging
from decimal import Decimal

from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from api.core.models import FeePayment, Notification

logger = logging.getLogger(__name__)


def _verify_paystack_signature(request):
    """Verify Paystack webhook signature using HMAC-SHA512."""
    secret = getattr(settings, "PAYSTACK_SECRET_KEY", "")
    if not secret:
        logger.error("PAYSTACK_SECRET_KEY not configured — cannot verify webhook")
        return False
    signature = request.headers.get("X-Paystack-Signature")
    if not signature:
        return False
    computed = hmac.new(
        secret.encode("utf-8"),
        request.body,
        hashlib.sha512,
    ).hexdigest()
    return hmac.compare_digest(computed, signature)


def _send_notification(user, title, message, level="info", url=""):
    """Create a Notification record and push via WebSocket."""
    Notification.objects.create(
        recipient=user,
        title=title,
        message=message,
        level=level,
        url=url,
    )
    # Push to WebSocket group if channel layer is available
    try:
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync

        channel_layer = get_channel_layer()
        if channel_layer:
            group = f"user_{user.id}_notifications"
            async_to_sync(channel_layer.group_send)(
                group,
                {
                    "type": "notification.message",
                    "message": message,
                },
            )
    except Exception:
        pass  # WebSocket push is best-effort


@csrf_exempt
@require_POST
def paystack_webhook(request):
    """
    Paystack webhook endpoint.
    Verify transaction and update FeePayment status.
    """
    if not _verify_paystack_signature(request):
        return JsonResponse({"detail": "Invalid signature"}, status=400)

    try:
        payload = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"detail": "Invalid JSON"}, status=400)

    event = payload.get("event")
    data = payload.get("data", {})

    if event != "charge.success":
        return JsonResponse({"detail": "Event ignored"}, status=200)

    reference = data.get("reference")
    if not reference:
        return JsonResponse({"detail": "Missing reference"}, status=400)

    # Find the FeePayment by reference
    try:
        payment = FeePayment.objects.select_related("student__user").get(
            reference=reference
        )
    except FeePayment.DoesNotExist:
        logger.warning("Webhook received for unknown reference: %s", reference)
        return JsonResponse({"detail": "Payment not found"}, status=404)

    # Already processed
    if payment.status == "paid":
        return JsonResponse({"detail": "Already processed"}, status=200)

    # Update payment
    amount_in_naira = Decimal(str(data.get("amount", 0))) / Decimal("100")
    payment.amount_paid += amount_in_naira
    payment.paystack_response = data
    payment.last_payment_date = data.get("paid_at")
    payment.save()

    # Send notification to student
    student_user = payment.student.user
    if payment.status == "paid":
        _send_notification(
            student_user,
            "Payment Complete",
            f"Your payment of ₦{amount_in_naira:,.2f} has been confirmed. Balance: ₦{payment.balance:,.2f}",
            level="success",
            url="/payments",
        )
    else:
        _send_notification(
            student_user,
            "Payment Received",
            f"₦{amount_in_naira:,.2f} received. Balance: ₦{payment.balance:,.2f}",
            level="info",
            url="/payments",
        )

    # Notify admins
    from api.core.models import Profile

    admin_profiles = Profile.objects.filter(
        role__in=["admin", "super_admin"]
    ).select_related("user")
    for admin_profile in admin_profiles:
        _send_notification(
            admin_profile.user,
            "Payment Received",
            f"Student {student_user.get_full_name() or student_user.username} "
            f"paid ₦{amount_in_naira:,.2f}. Reference: {reference}",
            level="info",
            url="/payments",
        )

    return JsonResponse({"detail": "Processed"}, status=200)
