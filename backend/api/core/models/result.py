# backend/api/models/result.py
# ─────────────────────────────────────────────────────────────────────────────
# Result system for NexusLMS
#
# Models:
#   Result      — per-subject score record (CA + Exam)
#   ReportCard  — per-student per-term summary (position, average, remarks)
#
# Workflow:
#   Subject teacher → draft/submit
#   Class teacher   → review
#   Admin           → publish (student can now see)
# ─────────────────────────────────────────────────────────────────────────────

from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


# ── Grade helper ──────────────────────────────────────────────────────────────

def compute_grade(total: float) -> str:
    """Nigerian standard grade scale."""
    if total >= 70:  return "A"
    if total >= 60:  return "B"
    if total >= 50:  return "C"
    if total >= 45:  return "D"
    if total >= 40:  return "E"
    return "F"


# ── Status choices ────────────────────────────────────────────────────────────

RESULT_STATUS = [
    ("draft",     "Draft"),           # teacher saving work in progress
    ("submitted", "Submitted"),       # teacher done, awaiting class teacher
    ("reviewed",  "Reviewed"),        # class teacher checked
    ("published", "Published"),       # admin approved — student can see
]

TERM_CHOICES = [
    ("First Term",  "First Term"),
    ("Second Term", "Second Term"),
    ("Third Term",  "Third Term"),
]


# ── Result model ──────────────────────────────────────────────────────────────

class Result(models.Model):
    """
    One record per student per subject per term per academic year.
    CA breakdown: test1(10) + test2(10) + assignment(10) + midterm(10) + exam(60) = 100
    """

    # ── Academic identity ─────────────────────────────────────────────────────
    student       = models.ForeignKey(
        "api.Profile",
        on_delete=models.CASCADE,
        related_name="results",
        limit_choices_to={"role": "student"},
    )
    course        = models.ForeignKey(
        "api.Course",
        on_delete=models.CASCADE,
        related_name="results",
    )
    entered_by    = models.ForeignKey(
        "api.Profile",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="results_entered",
        help_text="Subject teacher who entered this result",
    )
    reviewed_by   = models.ForeignKey(
        "api.Profile",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="results_reviewed",
        help_text="Class teacher who reviewed",
    )
    published_by  = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="results_published",
        help_text="Admin who published",
    )

    term          = models.CharField(max_length=20, choices=TERM_CHOICES)
    academic_year = models.CharField(max_length=9, help_text="e.g. 2025/2026")
    student_class = models.CharField(max_length=30, blank=True, default="")

    # ── CA Breakdown ─────────────────────────────────────────────────────────
    test1      = models.FloatField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        help_text="First test (max 10)",
    )
    test2      = models.FloatField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        help_text="Second test (max 10)",
    )
    assignment = models.FloatField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        help_text="Assignment score (max 10)",
    )
    midterm    = models.FloatField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        help_text="Mid-term test (max 10)",
    )
    exam       = models.FloatField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(60)],
        help_text="Exam score (max 60)",
    )

    # ── Computed fields (saved to DB for fast queries) ────────────────────────
    total      = models.FloatField(default=0, editable=False)
    grade      = models.CharField(max_length=2, blank=True, default="")
    position   = models.PositiveSmallIntegerField(
        null=True, blank=True,
        help_text="Position in subject within the class",
    )
    remark     = models.CharField(max_length=100, blank=True, default="")

    # ── Workflow status ───────────────────────────────────────────────────────
    status        = models.CharField(
        max_length=20,
        choices=RESULT_STATUS,
        default="draft",
        db_index=True,
    )
    submitted_at  = models.DateTimeField(null=True, blank=True)
    reviewed_at   = models.DateTimeField(null=True, blank=True)
    published_at  = models.DateTimeField(null=True, blank=True)

    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [("student", "course", "term", "academic_year")]
        ordering        = ["course__title", "student__user__last_name"]
        indexes = [
            models.Index(fields=["student", "term", "academic_year"]),
            models.Index(fields=["course", "term", "academic_year", "status"]),
            models.Index(fields=["student_class", "term", "academic_year"]),
        ]

    def save(self, *args, **kwargs):
        # Auto-compute total and grade
        self.total = round(
            self.test1 + self.test2 + self.assignment + self.midterm + self.exam, 2
        )
        self.grade = compute_grade(self.total)

        # Auto-set remark from grade
        REMARK_MAP = {
            "A": "Excellent",
            "B": "Very Good",
            "C": "Good",
            "D": "Pass",
            "E": "Pass",
            "F": "Fail",
        }
        if not self.remark:
            self.remark = REMARK_MAP.get(self.grade, "")

        # Cache student_class for fast report generation
        if not self.student_class and self.student_id:
            self.student_class = getattr(self.student, "student_class", "") or ""

        # Timestamp workflow transitions
        now = timezone.now()
        if self.status == "submitted" and not self.submitted_at:
            self.submitted_at = now
        if self.status == "reviewed" and not self.reviewed_at:
            self.reviewed_at = now
        if self.status == "published" and not self.published_at:
            self.published_at = now

        super().save(*args, **kwargs)

    def __str__(self):
        return (
            f"{self.student.user.username} | {self.course.title} | "
            f"{self.term} {self.academic_year} | {self.total}/{self.grade}"
        )

    @property
    def ca_total(self):
        return round(self.test1 + self.test2 + self.assignment + self.midterm, 2)


# ── ReportCard model ──────────────────────────────────────────────────────────

class ReportCard(models.Model):
    """
    Generated per student per term after all results are published.
    Stores term summary: total score, average, position in class, remarks.
    """

    student       = models.ForeignKey(
        "api.Profile",
        on_delete=models.CASCADE,
        related_name="report_cards",
        limit_choices_to={"role": "student"},
    )
    term          = models.CharField(max_length=20, choices=TERM_CHOICES)
    academic_year = models.CharField(max_length=9)
    student_class = models.CharField(max_length=30, blank=True, default="")

    # ── Summary stats ─────────────────────────────────────────────────────────
    total_subjects    = models.PositiveSmallIntegerField(default=0)
    total_score       = models.FloatField(default=0)
    average_score     = models.FloatField(default=0)
    position_in_class = models.PositiveSmallIntegerField(
        null=True, blank=True,
        help_text="Overall position in class this term",
    )
    class_size        = models.PositiveSmallIntegerField(default=0)

    # ── Attendance ────────────────────────────────────────────────────────────
    days_present  = models.PositiveSmallIntegerField(default=0)
    days_absent   = models.PositiveSmallIntegerField(default=0)
    total_days    = models.PositiveSmallIntegerField(default=0)

    # ── Remarks ───────────────────────────────────────────────────────────────
    class_teacher_remark = models.TextField(blank=True, default="")
    principal_remark     = models.TextField(blank=True, default="")
    resumption_date      = models.DateField(null=True, blank=True)

    # ── Status ────────────────────────────────────────────────────────────────
    is_published  = models.BooleanField(default=False, db_index=True)
    generated_at  = models.DateTimeField(auto_now=True)
    published_at  = models.DateTimeField(null=True, blank=True)
    published_by  = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="report_cards_published",
    )

    class Meta:
        unique_together = [("student", "term", "academic_year")]
        ordering        = ["-academic_year", "term", "position_in_class"]

    def __str__(self):
        return (
            f"{self.student.user.username} | "
            f"{self.term} {self.academic_year} | "
            f"Avg: {self.average_score} | Pos: {self.position_in_class}"
        )

    def publish(self, by_user):
        self.is_published  = True
        self.published_at  = timezone.now()
        self.published_by  = by_user
        self.save()