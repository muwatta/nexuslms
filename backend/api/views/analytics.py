from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from django.db.models import Avg, Count
from backend.api.core.models import Course, Enrollment, QuizSubmission


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def course_analytics(request, course_id):
    enrollments_qs = Enrollment.objects.filter(course_id=course_id)
    submissions_qs = QuizSubmission.objects.filter(quiz__course_id=course_id)
    avg_score = submissions_qs.aggregate(Avg('score'))['score__avg']

    return Response({
        "course_id": course_id,
        "total_enrollments": enrollments_qs.count(),
        "total_quiz_submissions": submissions_qs.count(),
        "average_quiz_score": avg_score,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def student_analytics(request, student_id):
    subs = QuizSubmission.objects.filter(student_id=student_id)
    avg_score = subs.aggregate(Avg('score'))['score__avg']
    courses = Enrollment.objects.filter(student_id=student_id).values(
        'course__id', 'course__title'
    )

    return Response({
        "student_id": student_id,
        "total_quiz_submissions": subs.count(),
        "average_quiz_score": avg_score,
        "enrolled_courses": list(courses),
    })
