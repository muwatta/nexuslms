# example in core.py
from django.db import models
from django.utils import timezone

class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class PracticeQuestion(models.Model):
    course = models.ForeignKey(
        'api.Course', on_delete=models.CASCADE, related_name='practice_questions'
    )
    text = models.TextField()
    answer = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now, editable=False)

    def __str__(self):
        return f"PQ for {self.course.title}: {self.text[:30]}"
