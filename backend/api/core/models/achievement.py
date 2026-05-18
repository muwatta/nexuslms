from django.db import models
from backend.api.core.models import Profile, Course
from django.utils import timezone


class Achievement(models.Model):
    ACHIEVEMENT_TYPES = [
        ('certificate', 'Certificate'),
        ('badge', 'Badge'),
        ('award', 'Award'),
    ]

    student = models.ForeignKey(
        Profile,
        on_delete=models.CASCADE,
        related_name='achievements'
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    achievement_type = models.CharField(max_length=20, choices=ACHIEVEMENT_TYPES)
    date_earned = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student.user.username} - {self.title}"


class Project(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('archived', 'Archived'),
    ]

    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='projects'
    )
    title = models.CharField(max_length=200)
    description = models.TextField()
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.course.title}"


class Milestone(models.Model):
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='milestones'
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    related_to = models.CharField(
        max_length=50,
        choices=[
            ('enrollment', 'Enrollment'),
            ('assignment', 'Assignment'),
            ('quiz', 'Quiz'),
            ('project', 'Project'),
        ],
        default='enrollment'
    )
    progress_percentage = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.course.title} - {self.title}"
