from django.db import models
from .course import Course
class Assignment(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="assignments")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    deadline = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)  # keeps track of last edit

    def __str__(self):
        return self.title

    class Meta:
        ordering = ["-created_at"]
