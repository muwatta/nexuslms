# backend/api/views/instructor_views.py
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import PermissionDenied

from api.models import Profile, Assignment, Enrollment, Course
from api.serializers import ProfileSerializer, AssignmentSerializer, EnrollmentSerializer
from api.permissions import IsClassInstructor, IsSubjectInstructor, IsInstructor, IsAdminOrClassInstructor


def _get_instructor_profile(user):
    """Return profile or None — never raises."""
    try:
        return user.profile
    except Profile.DoesNotExist:
        return None


class InstructorProfileViewSet(ReadOnlyModelViewSet):
    """
    Instructors see students relevant to them:
    - Class instructor   → all students in their department
    - Subject instructor → students enrolled in their courses
    FIX #2: swagger_fake_view guard added so schema generation doesn't crash.
    """
    serializer_class   = ProfileSerializer
    permission_classes = [IsAuthenticated, IsInstructor]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Profile.objects.none()

        profile = _get_instructor_profile(self.request.user)
        if not profile:
            return Profile.objects.none()

        # Support both teacher_type (new) and instructor_type (old)
        itype = (
            getattr(profile, "teacher_type", None) or
            getattr(profile, "instructor_type", None) or
            ""
        )

        if itype == "class":
            return Profile.objects.filter(
                department=profile.department,
                role__iexact="student",
            ).select_related("user")

        if itype == "subject":
            instructor_courses = Course.objects.filter(instructor=profile)
            enrolled_ids = Enrollment.objects.filter(
                course__in=instructor_courses,
                status__in=["active", "pending"],
            ).values_list("student_id", flat=True).distinct()

            if enrolled_ids:
                return Profile.objects.filter(
                    id__in=enrolled_ids,
                ).select_related("user")

            return Profile.objects.filter(
                department=profile.department,
                role__iexact="student",
            ).select_related("user")

        return Profile.objects.none()


class InstructorAssignmentViewSet(ModelViewSet):
    serializer_class   = AssignmentSerializer
    permission_classes = [IsAuthenticated, IsInstructor]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Assignment.objects.none()

        profile = _get_instructor_profile(self.request.user)
        if not profile:
            return Assignment.objects.none()

        # Filter by department — covers both old instructor FK and SubjectAssignment model
        dept = getattr(profile, "department", None)
        if dept:
            return Assignment.objects.filter(course__department=dept)
        return Assignment.objects.filter(course__instructor=profile)

    def perform_create(self, serializer):
        profile = _get_instructor_profile(self.request.user)
        if not profile:
            raise PermissionDenied("Profile not found.")

        course = serializer.validated_data.get("course")
        if course:
            course_dept = getattr(course, "department", None)
            if course_dept and course_dept != profile.department:
                raise PermissionDenied("Cannot create assignments outside your department.")

        serializer.save(created_by=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"error": "Validation failed", "details": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            self.perform_create(serializer)
            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED,
                headers=self.get_success_headers(serializer.data),
            )
        except PermissionDenied as e:
            return Response({"error": str(e)}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return Response(
                {"error": "Failed to create assignment", "detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )


class InstructorStudentManagementViewSet(ModelViewSet):
    serializer_class   = ProfileSerializer
    permission_classes = [IsAuthenticated, IsAdminOrClassInstructor]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Profile.objects.none()

        profile = _get_instructor_profile(self.request.user)
        if not profile:
            return Profile.objects.none()

        role  = (profile.role or "").lower()
        itype = (
            getattr(profile, "teacher_type", None) or
            getattr(profile, "instructor_type", None) or
            ""
        ).lower()

        if role in ("admin", "super_admin"):
            return Profile.objects.filter(
                role__iexact="student"
            ).select_related("user")

        if role in ("instructor", "teacher") and itype == "class":
            return Profile.objects.filter(
                department=profile.department,
                role__iexact="student",
            ).select_related("user")

        return Profile.objects.none()

    def perform_create(self, serializer):
        profile = _get_instructor_profile(self.request.user)
        if not profile:
            raise PermissionDenied("Profile not found.")
        student = serializer.save(department=profile.department, role="student")
        self._auto_enroll(student, profile.department)

    def _auto_enroll(self, student_profile, department):
        from django.utils import timezone as tz
        year    = f"{tz.now().year}/{tz.now().year + 1}"
        courses = Course.objects.filter(department=department, is_active=True)
        if student_profile.student_class:
            courses = courses.filter(student_class=student_profile.student_class)
        for course in courses:
            Enrollment.objects.get_or_create(
                student=student_profile, course=course, academic_year=year,
                defaults={"status": "active", "enrolled_at": tz.now()},
            )

    def perform_update(self, serializer):
        instance    = serializer.save()
        user_fields = {
            k: self.request.data[k]
            for k in ("first_name", "last_name")
            if k in self.request.data
        }
        if user_fields:
            for attr, val in user_fields.items():
                setattr(instance.user, attr, val)
            instance.user.save()

    def perform_destroy(self, instance):
        profile = _get_instructor_profile(self.request.user)
        if not profile or (profile.role or "").lower() not in ("admin", "super_admin"):
            raise PermissionDenied("Only administrators can delete student profiles.")
        instance.delete()

    @action(detail=False, methods=["get"])
    def by_class(self, request):
        profile = _get_instructor_profile(request.user)
        if not profile:
            return Response({"error": "Profile not found"}, status=403)

        dept          = profile.department
        class_choices = Profile.get_classes_for_department(dept)
        students_qs   = Profile.objects.filter(
            department=dept, role__iexact="student"
        ).select_related("user")

        result = {}
        for code, name in class_choices:
            cls_students = students_qs.filter(student_class=code)
            result[name] = {
                "code":     code,
                "count":    cls_students.count(),
                "students": ProfileSerializer(cls_students, many=True).data,
            }
        return Response({"department": dept, "classes": result})


class InstructorResultsViewSet(ReadOnlyModelViewSet):
    serializer_class   = EnrollmentSerializer
    permission_classes = [IsAuthenticated, IsInstructor]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Enrollment.objects.none()

        profile = _get_instructor_profile(self.request.user)
        if not profile:
            return Enrollment.objects.none()

        itype = (
            getattr(profile, "teacher_type", None) or
            getattr(profile, "instructor_type", None) or
            ""
        )

        if itype == "class":
            return Enrollment.objects.filter(
                student__department=profile.department,
            ).select_related("student__user", "course")

        if itype == "subject":
            qs = Enrollment.objects.filter(
                course__instructor=profile,
            ).select_related("student__user", "course")
            if qs.exists():
                return qs
            return Enrollment.objects.filter(
                student__department=profile.department,
            ).select_related("student__user", "course")

        return Enrollment.objects.none()

    @action(detail=True, methods=["post"])
    def update_result(self, request, pk=None):
        enrollment = self.get_object()
        profile    = _get_instructor_profile(request.user)
        if not profile:
            return Response({"error": "Profile not found"}, status=403)

        score_fields = [
            "first_test_score", "second_test_score",
            "attendance_score",  "assignment_score",
        ]
        for field in score_fields:
            if field in request.data:
                val = request.data[field]
                if val is not None:
                    try:
                        numeric = float(val)
                    except (TypeError, ValueError):
                        return Response(
                            {"error": f"{field} must be a number"},
                            status=status.HTTP_400_BAD_REQUEST,
                        )
                    if not (0 <= numeric <= 100):
                        return Response(
                            {"error": f"{field} must be between 0 and 100"},
                            status=status.HTTP_400_BAD_REQUEST,
                        )
                    setattr(enrollment, field, numeric)
        enrollment.save()
        return Response(self.get_serializer(enrollment).data)