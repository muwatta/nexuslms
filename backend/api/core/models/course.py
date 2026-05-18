from django.db import models
from .profile import Profile
from .core import TimeStampedModel

class Course(TimeStampedModel):
    DEPARTMENT_CHOICES = [
        ("western", "Western School"),
        ("arabic", "Arabic School"),
        ("programming", "Programming"),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Department field (critical addition)
    department = models.CharField(
        max_length=20, 
        choices=DEPARTMENT_CHOICES, 
        default="western",
        db_index=True
    )
    
    # Optional: Class-specific courses (e.g., JSS1, JSS2, Web-Dev, etc.)
    student_class = models.CharField(
        max_length=20, 
        blank=True, 
        null=True,
        db_index=True,
        help_text="Specific class for this course (e.g., JSS1, Web-Dev, Ibtidaahi)"
    )
    
    instructor = models.ForeignKey(
        Profile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={'role': 'instructor'},
        related_name='courses'
    )
    
    is_active = models.BooleanField(default=True, db_index=True)
    
    class Meta:
        ordering = ['department', 'student_class', 'title']
        indexes = [
            models.Index(fields=['department', 'student_class', 'is_active']),
        ]

    def __str__(self):
        dept_display = self.get_department_display()
        class_display = f" - {self.student_class}" if self.student_class else ""
        return f"{self.title}{class_display} ({dept_display})"
    
    def get_full_title(self):
        """Return full course title with class info"""
        if self.student_class:
            return f"{self.title} ({self.student_class})"
        return self.title