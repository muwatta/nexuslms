from django.db import models
from django.utils import timezone
from .core import TimeStampedModel


PLAN_CHOICES = [
    ("free",     "Free Trial"),
    ("starter",  "Starter"),
    ("pro",      "Professional"),
    ("enterprise", "Enterprise"),
]


class School(TimeStampedModel):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=10, unique=True, db_index=True)
    slug = models.SlugField(max_length=50, unique=True, db_index=True,
                            null=True, blank=True,
                            help_text="URL-friendly identifier, e.g. 'al-furqan'")
    is_active = models.BooleanField(default=True)

    # Contact / owner info
    owner_email = models.EmailField(blank=True, default="")
    owner_phone = models.CharField(max_length=20, blank=True, default="")
    website = models.URLField(blank=True, default="")

    # Plan & billing
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default="free", db_index=True)
    trial_ends_at = models.DateTimeField(null=True, blank=True,
                                          help_text="When the free trial expires.")
    subscription_id = models.CharField(max_length=100, blank=True, default="",
                                       help_text="Paystack customer/plan reference.")

    # Limits (per-plan caps enforced by the app)
    max_students = models.PositiveIntegerField(default=50)
    max_teachers = models.PositiveIntegerField(default=10)
    max_courses = models.PositiveIntegerField(default=30)

    # Feature flags
    allow_western = models.BooleanField(default=True)
    allow_arabic = models.BooleanField(default=True)
    allow_programming = models.BooleanField(default=True)

    # Timestamps for subscription lifecycle
    subscribed_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True,
                                       help_text="When the current subscription ends.")

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"

    @property
    def is_trial_expired(self) -> bool:
        if not self.trial_ends_at:
            return False
        return timezone.now() > self.trial_ends_at

    @property
    def is_subscription_active(self) -> bool:
        if self.plan == "free":
            return not self.is_trial_expired
        if self.expires_at:
            return timezone.now() <= self.expires_at
        return self.subscribed_at is not None

    @property
    def can_add_student(self) -> bool:
        from .profile import Profile
        current = Profile.objects.filter(school=self, role="student").count()
        return current < self.max_students

    @property
    def can_add_teacher(self) -> bool:
        from .profile import Profile
        current = Profile.objects.filter(school=self, role="teacher").count()
        return current < self.max_teachers

    @property
    def can_add_course(self) -> bool:
        from .course import Course
        current = Course.objects.filter(school=self).count()
        return current < self.max_courses