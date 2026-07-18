import hashlib
import hmac
import json
from decimal import Decimal
from datetime import date, timedelta

from django.test import TestCase, override_settings
from django.test.client import RequestFactory
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from api.core.models import Notification, FeePayment, Profile, Course, Enrollment
from api.views.webhook_views import paystack_webhook

User = get_user_model()

TEST_SECRET = "test-paystack-secret-key"


def make_user(username, role="student", department="western", **kw):
    user = User.objects.create_user(username=username, password="testpass123")
    profile, _ = Profile.objects.get_or_create(
        user=user,
        defaults={"role": role, "department": department, **kw},
    )
    return user, profile


# ── Notification Model Tests ──────────────────────────────────────────────────

class NotificationModelTest(TestCase):
    def setUp(self):
        self.user, _ = make_user("notif_user", role="student")

    def test_create_notification(self):
        n = Notification.objects.create(
            recipient=self.user,
            title="Test",
            message="Hello",
            level="info",
        )
        self.assertEqual(n.recipient, self.user)
        self.assertFalse(n.is_read)

    def test_mark_read(self):
        n = Notification.objects.create(
            recipient=self.user,
            title="Test",
            message="Hello",
        )
        n.mark_read()
        n.refresh_from_db()
        self.assertTrue(n.is_read)

    def test_mark_read_idempotent(self):
        n = Notification.objects.create(
            recipient=self.user,
            title="Test",
            message="Hello",
            is_read=True,
        )
        n.mark_read()  # should not error
        n.refresh_from_db()
        self.assertTrue(n.is_read)

    def test_unread_count(self):
        Notification.objects.create(
            recipient=self.user, title="A", message="a", is_read=False
        )
        Notification.objects.create(
            recipient=self.user, title="B", message="b", is_read=True
        )
        self.assertEqual(Notification.unread_count(self.user), 1)

    def test_only_sees_own_notifications(self):
        other_user, _ = make_user("other_notif_user", role="student")
        Notification.objects.create(
            recipient=self.user, title="Mine", message="x"
        )
        Notification.objects.create(
            recipient=other_user, title="Theirs", message="y"
        )
        self.assertEqual(Notification.objects.filter(recipient=self.user).count(), 1)


# ── Notification API Tests ───────────────────────────────────────────────────

class NotificationAPITest(TestCase):
    def setUp(self):
        self.user, _ = make_user("notif_api_user", role="student")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_list_notifications(self):
        Notification.objects.create(
            recipient=self.user, title="A", message="a"
        )
        resp = self.client.get("/api/notifications/")
        self.assertEqual(resp.status_code, 200)

    def test_unread_count(self):
        Notification.objects.create(
            recipient=self.user, title="A", message="a", is_read=False
        )
        resp = self.client.get("/api/notifications/unread_count/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["count"], 1)

    def test_mark_all_read(self):
        Notification.objects.create(
            recipient=self.user, title="A", message="a", is_read=False
        )
        Notification.objects.create(
            recipient=self.user, title="B", message="b", is_read=False
        )
        resp = self.client.post("/api/notifications/mark_all_read/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["marked"], 2)
        self.assertEqual(
            Notification.objects.filter(
                recipient=self.user, is_read=False
            ).count(),
            0,
        )

    def test_mark_single_read(self):
        n = Notification.objects.create(
            recipient=self.user, title="A", message="a", is_read=False
        )
        resp = self.client.post(f"/api/notifications/{n.id}/mark_read/")
        self.assertEqual(resp.status_code, 200)
        n.refresh_from_db()
        self.assertTrue(n.is_read)

    def test_unauthenticated_cannot_list(self):
        c = APIClient()
        resp = c.get("/api/notifications/")
        self.assertIn(resp.status_code, [401, 403])


# ── Paystack Webhook Tests ───────────────────────────────────────────────────

@override_settings(PAYSTACK_SECRET_KEY=TEST_SECRET)
class PaystackWebhookTest(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.admin, self.admin_profile = make_user(
            "webhook_admin", role="super_admin"
        )
        self.student, self.student_profile = make_user(
            "webhook_student", role="student"
        )
        self.payment = FeePayment.objects.create(
            student=self.student_profile,
            academic_year="2024/2025",
            term="First Term",
            total_amount=Decimal("50000.00"),
            amount_paid=Decimal("0"),
            balance=Decimal("50000.00"),
            status="pending",
            due_date=date.today() + timedelta(days=90),
            reference="test-ref-001",
        )

    def _sign(self, body):
        return hmac.new(
            TEST_SECRET.encode("utf-8"),
            body,
            hashlib.sha512,
        ).hexdigest()

    def _make_event(self, reference, amount_kobo=5000000, event="charge.success"):
        return {
            "event": event,
            "data": {
                "reference": reference,
                "amount": amount_kobo,
                "paid_at": "2025-01-15T10:00:00Z",
                "status": "success",
            },
        }

    def test_valid_webhook_updates_payment(self):
        body = json.dumps(self._make_event("test-ref-001")).encode()
        sig = self._sign(body)
        req = self.factory.post(
            "/api/webhooks/paystack/",
            data=body,
            content_type="application/json",
            HTTP_X_PAYSTACK_SIGNATURE=sig,
        )
        resp = paystack_webhook(req)
        self.assertEqual(resp.status_code, 200)
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, "paid")
        self.assertEqual(self.payment.amount_paid, Decimal("50000.00"))

    def test_invalid_signature_rejected(self):
        body = json.dumps(self._make_event("test-ref-001")).encode()
        req = self.factory.post(
            "/api/webhooks/paystack/",
            data=body,
            content_type="application/json",
            HTTP_X_PAYSTACK_SIGNATURE="invalid_sig",
        )
        resp = paystack_webhook(req)
        self.assertEqual(resp.status_code, 400)

    def test_unknown_reference_returns_404(self):
        body = json.dumps(self._make_event("nonexistent-ref")).encode()
        sig = self._sign(body)
        req = self.factory.post(
            "/api/webhooks/paystack/",
            data=body,
            content_type="application/json",
            HTTP_X_PAYSTACK_SIGNATURE=sig,
        )
        resp = paystack_webhook(req)
        self.assertEqual(resp.status_code, 404)

    def test_already_paid_payment_ignored(self):
        self.payment.status = "paid"
        self.payment.amount_paid = Decimal("50000.00")
        self.payment.balance = Decimal("0")
        self.payment.save()
        body = json.dumps(self._make_event("test-ref-001")).encode()
        sig = self._sign(body)
        req = self.factory.post(
            "/api/webhooks/paystack/",
            data=body,
            content_type="application/json",
            HTTP_X_PAYSTACK_SIGNATURE=sig,
        )
        resp = paystack_webhook(req)
        self.assertEqual(resp.status_code, 200)

    def test_non_success_event_ignored(self):
        body = json.dumps(self._make_event("test-ref-001", event="charge.failed")).encode()
        sig = self._sign(body)
        req = self.factory.post(
            "/api/webhooks/paystack/",
            data=body,
            content_type="application/json",
            HTTP_X_PAYSTACK_SIGNATURE=sig,
        )
        resp = paystack_webhook(req)
        self.assertEqual(resp.status_code, 200)
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, "pending")

    def test_webhook_creates_notification(self):
        body = json.dumps(self._make_event("test-ref-001")).encode()
        sig = self._sign(body)
        req = self.factory.post(
            "/api/webhooks/paystack/",
            data=body,
            content_type="application/json",
            HTTP_X_PAYSTACK_SIGNATURE=sig,
        )
        paystack_webhook(req)
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.student, title="Payment Complete"
            ).exists()
        )

    def test_partial_payment(self):
        body = json.dumps(self._make_event("test-ref-001", amount_kobo=2000000)).encode()
        sig = self._sign(body)
        req = self.factory.post(
            "/api/webhooks/paystack/",
            data=body,
            content_type="application/json",
            HTTP_X_PAYSTACK_SIGNATURE=sig,
        )
        resp = paystack_webhook(req)
        self.assertEqual(resp.status_code, 200)
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, "partial")
        self.assertEqual(self.payment.amount_paid, Decimal("20000.00"))
        self.assertEqual(self.payment.balance, Decimal("30000.00"))


# ── Enrollment Notification Tests ─────────────────────────────────────────────

class EnrollmentNotificationTest(TestCase):
    def setUp(self):
        self.student, self.student_profile = make_user(
            "enroll_notif_student", role="student"
        )
        self.course = Course.objects.create(
            title="Test Course",
            department="western",
            student_class="jss1a",
            is_active=True,
        )

    def test_enrollment_creates_notification(self):
        from api.services.notifications import notify_enrollment

        enrollment = Enrollment.objects.create(
            student=self.student_profile,
            course=self.course,
            academic_year="2024/2025",
            status="active",
        )
        notify_enrollment(enrollment)
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.student,
                title__contains="Enrolled",
            ).exists()
        )
