from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from .core import TimeStampedModel

class InstructorAssignment(TimeStampedModel):
    """Tracks what subjects/classes instructors can teach with admin permissions"""
    instructor = models.ForeignKey(
        'api.Profile',
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'instructor'},
        related_name='assignments'
    )
    
    # Can assign either subjects or classes or both
    subject = models.ForeignKey(
        'api.Course',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='instructor_assignments'
    )
    student_class = models.CharField(max_length=20, null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='assignments_created'
    )
    assigned_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        if not self.subject and not self.student_class:
            raise ValidationError("Either subject or student_class must be set")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        item = self.subject.title if self.subject else self.student_class
        return f"{self.instructor.user.username} -> {item}"