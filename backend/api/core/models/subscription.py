from django.db import models
from django.utils import timezone


class Subscription(models.Model):
    STATUS_CHOICES = [
        ("active",   "Active"),
        ("past_due", "Past Due"),
        ("cancelled", "Cancelled"),
        ("expired",  "Expired"),
    ]

    school = models.ForeignKey(
        "api.School",
        on_delete=models.CASCADE,
        related_name="subscriptions",
    )
    plan = models.CharField(max_length=20, choices=[
        ("starter",    "Starter"),
        ("pro",        "Professional"),
        ("enterprise", "Enterprise"),
    ])
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active", db_index=True)

    # Paystack references
    paystack_customer_code = models.CharField(max_length=100, blank=True, default="")
    paystack_subscription_code = models.CharField(max_length=100, blank=True, default="")
    paystack_plan_code = models.CharField(max_length=100, blank=True, default="")

    # Pricing
    amount = models.DecimalField(max_digits=10, decimal_places=2, help_text="Amount in NGN")
    currency = models.CharField(max_length=3, default="NGN")

    # Dates
    start_date = models.DateTimeField(default=timezone.now)
    next_billing_date = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.school.name} — {self.plan} ({self.status})"

    @property
    def is_active(self) -> bool:
        return self.status == "active" and (
            self.next_billing_date is None or self.next_billing_date > timezone.now()
        )
