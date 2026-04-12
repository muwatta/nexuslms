import sys
import os
import django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nexuslms.settings.dev')
django.setup()

from api.models import Course, Assignment, Quiz, Question
from django.utils import timezone
from datetime import timedelta

# Get all active courses
courses = Course.objects.filter(is_active=True)

assignments_created = 0
quizzes_created = 0

for course in courses:
    for i in range(1, 3):
        deadline = timezone.now() + timedelta(days=7 * i)
        assignment, created = Assignment.objects.get_or_create(
            course=course,
            title=f"{course.title} - Assignment {i}",
            defaults={
                "description": f"Complete the following tasks based on {course.title}. This assignment covers weeks {i}.",
                "deadline": deadline,
            },
        )
        if created:
            assignments_created += 1

    quiz, created = Quiz.objects.get_or_create(
        course=course,
        title=f"{course.title} - Quiz 1",
        defaults={
            "description": f"Test your knowledge on {course.title}.",
            "total_marks": 50,
            "duration": 30,
        },
    )
    if created:
        quizzes_created += 1
        for q_num in range(1, 6):
            Question.objects.create(
                quiz=quiz,
                order=q_num,
                text=f"Sample question {q_num} for {course.title}. What is the correct answer?",
                choices=["Option A", "Option B", "Option C", "Option D"],
                correct_index=0,
                marks=10,
            )

print(f"Added {assignments_created} assignments and {quizzes_created} quizzes.")
