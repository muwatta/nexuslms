from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from django.db.models import Avg, Count, Q
from api.core.models import Course, Enrollment, Profile, QuizSubmission
from api.permissions import IsAdminOrTeacher


def _can_access_course(user, course):
    profile = getattr(user, "profile", None)
    if not profile:
        return False
    if user.is_superuser or profile.role in {"admin", "super_admin"}:
        return True
    return profile.role in {"school_admin", "teacher"} and profile.department == course.department


def _can_access_student(user, student):
    profile = getattr(user, "profile", None)
    if not profile:
        return False
    if user.is_superuser or profile.role in {"admin", "super_admin"}:
        return True
    return profile.role in {"school_admin", "teacher"} and profile.department == student.department


def _find_course_by_identifier(course_identifier: str) -> Course | None:
    identifier = (course_identifier or "").strip()
    if not identifier:
        return None

    if identifier.isdigit():
        course = Course.objects.filter(pk=int(identifier)).first()
        if course:
            return course

    course = Course.objects.filter(title__iexact=identifier).first()
    if course:
        return course

    return Course.objects.filter(title__icontains=identifier).order_by("title").first()


def _find_student_by_identifier(student_identifier: str) -> Profile | None:
    identifier = (student_identifier or "").strip()
    if not identifier:
        return None

    if identifier.isdigit():
        student = Profile.objects.filter(pk=int(identifier), role="student").first()
        if student:
            return student

    student = Profile.objects.filter(student_id__iexact=identifier, role="student").first()
    if student:
        return student

    student = Profile.objects.filter(user__username__iexact=identifier, role="student").first()
    if student:
        return student

    return Profile.objects.filter(
        Q(user__first_name__icontains=identifier)
        | Q(user__last_name__icontains=identifier)
        | Q(user__username__icontains=identifier),
        role="student",
    ).order_by("user__username").first()


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminOrTeacher])
def course_analytics(request, course_identifier):
    course = _find_course_by_identifier(course_identifier)
    if course is None:
        return Response(
            {"detail": "Course not found for the given identifier."},
            status=404,
        )
    if not _can_access_course(request.user, course):
        return Response({"detail": "You cannot access analytics for this course."}, status=403)

    enrollments_qs = Enrollment.objects.filter(course_id=course.id)
    submissions_qs = QuizSubmission.objects.filter(quiz__course_id=course.id)
    avg_score = submissions_qs.aggregate(Avg("score"))["score__avg"]

    return Response({
        "course_identifier": course_identifier,
        "course_id": course.id,
        "course_title": course.title,
        "total_enrollments": enrollments_qs.count(),
        "total_quiz_submissions": submissions_qs.count(),
        "average_quiz_score": avg_score,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminOrTeacher])
def student_analytics(request, student_identifier):
    student = _find_student_by_identifier(student_identifier)
    if student is None:
        return Response(
            {"detail": "Student not found for the given identifier."},
            status=404,
        )
    if not _can_access_student(request.user, student):
        return Response({"detail": "You cannot access analytics for this student."}, status=403)

    subs = QuizSubmission.objects.filter(student_id=student.id)
    avg_score = subs.aggregate(Avg("score"))["score__avg"]
    courses = Enrollment.objects.filter(student_id=student.id).values(
        "course__id",
        "course__title",
    )

    return Response({
        "student_identifier": student_identifier,
        "student_id": student.id,
        "student_username": student.user.username,
        "total_quiz_submissions": subs.count(),
        "average_quiz_score": avg_score,
        "enrolled_courses": list(courses),
    })
