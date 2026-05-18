from django.db import models
from .assignment import Assignment
from .profile import Profile


class AssignmentSubmission(models.Model):

    FILE_TYPES = [
        ("pdf", "PDF"),
        ("doc", "Word Document"),
        ("image", "Image"),
        ("video", "Video"),
        ("other", "Other"),
    ]

    assignment = models.ForeignKey(
        Assignment,
        on_delete=models.CASCADE,
        related_name="submissions"
    )

    student = models.ForeignKey(
        Profile,
        on_delete=models.CASCADE,
        limit_choices_to={"role": "student"}
    )

    file = models.FileField(upload_to="submissions/%Y/%m/")
    file_type = models.CharField(max_length=10, choices=FILE_TYPES,default="other")

    submitted_at = models.DateTimeField(auto_now_add=True)

    grade = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    feedback = models.TextField(blank=True)

    status = models.CharField(max_length=20, default="submitted")

    class Meta:
        unique_together = ["assignment", "student"]

    def __str__(self):
        return f"{self.student.user.username} - {self.assignment.title}"