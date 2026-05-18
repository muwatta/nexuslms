# backend/api/models/subjectassignment.py


from django.db import models
from django.conf import settings
from .profile import SUBJECT_CHOICES


class SubjectAssignment(models.Model):
    """
    Assigns a teacher (Profile with role=teacher) to a student (Profile with
    role=student) for a specific subject.

    One student can have at most one teacher per subject.
    One teacher can be assigned to many students for many subjects.
    """

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="subject_assignments",
        limit_choices_to={"profile__role": "student"},
    )
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="teaching_assignments",
        limit_choices_to={"profile__role": "teacher"},
    )
    subject = models.CharField(
        max_length=50,
        choices=[(k, v) for k, v in SUBJECT_CHOICES if not k.startswith("──")],
        db_index=True,
    )

    is_auto_assigned = models.BooleanField(
        default=True,
        help_text="True = seeded automatically; False = manually set by admin.",
    )

    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [("student", "subject")]
        ordering = ["student", "subject"]
        verbose_name = "Subject Assignment"
        verbose_name_plural = "Subject Assignments"

    def __str__(self):
        teacher_name = self.teacher.username if self.teacher else "Unassigned"
        return (
            f"{self.student.username} ← {teacher_name} ({self.subject})"
        )