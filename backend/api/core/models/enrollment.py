from django.db import models
from django.utils import timezone
from .core import TimeStampedModel

class Enrollment(TimeStampedModel):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('dropped', 'Dropped'),
        ('promoted', 'Promoted'),
    ]
    
    student = models.ForeignKey(
        'api.Profile',
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'student'},
        related_name='enrollments'
    )
    course = models.ForeignKey(
        'api.Course',
        on_delete=models.CASCADE,
        related_name='enrollments'
    )
    academic_year = models.CharField(max_length=9, help_text="Format: 2024/2025")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    enrolled_at = models.DateTimeField(default=timezone.now)
    completed_at = models.DateTimeField(null=True, blank=True)
        # Term tracking
    term = models.CharField(
        max_length=20,
        default='First Term',
        choices=[
            ('First Term',  'First Term'),
            ('Second Term', 'Second Term'),
            ('Third Term',  'Third Term'),
        ],
    )
    add_drop_count = models.PositiveSmallIntegerField(default=0)
    drop_history = models.JSONField(default=list, blank=True)
    # Promotion tracking
    promoted_from = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='promoted_to'
    )
    promoted_at = models.DateTimeField(null=True, blank=True)
    promoted_by = models.ForeignKey(
        'api.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='promotions_made'
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['student', 'course', 'academic_year', 'term'],
                name='unique_enrollment_per_year_term',
            )
        ]
        ordering = ['-academic_year', '-enrolled_at']

    def promote_to(self, next_course, by_user=None):
        """Create new enrollment as promotion from current"""
        new_enrollment = Enrollment.objects.create(
            student=self.student,
            course=next_course,
            academic_year=self._get_next_academic_year(),
            status='active',
            promoted_from=self,
            promoted_at=timezone.now(),
            promoted_by=by_user
        )
        self.status = 'promoted'
        self.save()
        
        # Log promotion
        from .auditlog import AuditLog
        AuditLog.objects.create(
            user=by_user,
            action='promote',
            model_name='Enrollment',
            object_id=str(new_enrollment.pk),
            old_values={'enrollment_id': self.pk, 'course': self.course.title},
            new_values={'course': next_course.title}
        )
        return new_enrollment

    def _get_next_academic_year(self):
        """Calculate next academic year from current"""
        current = self.academic_year
        try:
            start, end = current.split('/')
            return f"{int(start)+1}/{int(end)+1}"
        except (ValueError, AttributeError):
            current_year = timezone.now().year
            return f"{current_year}/{current_year+1}"

    def __str__(self):
        return f"{self.student.user.username} -> {self.course.title} ({self.academic_year})"