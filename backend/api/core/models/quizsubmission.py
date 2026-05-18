from django.db import models
from backend.api.core.models import Quiz
from backend.api.core.models import Profile
from django.utils import timezone

class QuizSubmission(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE)
    # restrict to profile.role student; we don't rely on custom user model
    student = models.ForeignKey(
        Profile,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'student'}
    )
    # answers stored as {question_id: selected_index}
    answers = models.JSONField(default=dict)
    score = models.FloatField(null=True, blank=True)
    published = models.BooleanField(default=False)
    started_at = models.DateTimeField(null=True, blank=True)
    submitted_at = models.DateTimeField(default=timezone.now, editable=False)
    created_at = models.DateTimeField(default=timezone.now, editable=False)

    def __str__(self):
        return f"{self.student.user.username} - {self.quiz.title}"

    def grade(self):
        total = 0.0
        for q in self.quiz.questions.all():
            sel = self.answers.get(str(q.id))
            if sel is not None and sel == q.correct_index:
                total += q.marks
        self.score = total
        return total

    def save(self, *args, **kwargs):
        # compute grade automatically if answers provided
        if self.score is None and self.answers:
            self.grade()
        super().save(*args, **kwargs)
