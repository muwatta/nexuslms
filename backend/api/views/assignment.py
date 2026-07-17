from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied

from api.core.models import Assignment, AssignmentSubmission, Course
from api.pdf_utils import generate_assignment_pdf
from api.serializers import (
    AssignmentSerializer,
    AssignmentSubmissionSerializer,
)
from api.permissions import IsAdminOrTeacher


def accessible_assignments(user):
    profile = getattr(user, "profile", None)
    if not profile:
        return Assignment.objects.none()
    if user.is_superuser or profile.role in {"admin", "super_admin"}:
        return Assignment.objects.all()
    if profile.role in {"school_admin", "teacher"}:
        return Assignment.objects.filter(course__department=profile.department)
    if profile.role == "student":
        return Assignment.objects.filter(course__enrollments__student=profile, course__enrollments__status="active").distinct()
    return Assignment.objects.none()


def can_manage_course(user, course):
    profile = getattr(user, "profile", None)
    if not profile:
        return False
    if user.is_superuser or profile.role in {"admin", "super_admin"}:
        return True
    return profile.role in {"school_admin", "teacher"} and profile.department == course.department


class AssignmentViewSet(ModelViewSet):
    serializer_class = AssignmentSerializer

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update", "destroy", "download_template", "upload_results"}:
            return [IsAuthenticated(), IsAdminOrTeacher()]
        return [IsAuthenticated()]

    def get_queryset(self):
        return accessible_assignments(self.request.user).select_related("course").order_by("-deadline", "-id")

    def perform_create(self, serializer):
        course = serializer.validated_data["course"]
        if not can_manage_course(self.request.user, course):
            raise PermissionDenied("You cannot create an assignment for this course.")
        serializer.save()

    def perform_update(self, serializer):
        if not accessible_assignments(self.request.user).filter(pk=serializer.instance.pk).exists():
            raise PermissionDenied("You cannot modify this assignment.")
        serializer.save()

    @action(detail=True, methods=["get"], permission_classes=[IsAuthenticated, IsAdminOrTeacher])
    def download_template(self, request, pk=None):
        """Download a CSV template listing enrolled students for this assignment's course."""
        import csv
        from django.http import HttpResponse
        try:
            assignment = self.get_object()
        except Exception:
            return Response({"detail": "Not found"}, status=404)
        students = assignment.course.enrollment_set.select_related('student__user').all()
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="assignment_{assignment.id}_template.csv"'
        writer = csv.writer(response)
        writer.writerow(["student_username", "student_id", "student_name", "grade"])
        for enroll in students:
            profile = enroll.student
            writer.writerow([profile.user.username, profile.id, profile.user.get_full_name() or profile.user.username, ""])
        return response

    @action(detail=True, methods=["get"], permission_classes=[IsAuthenticated], url_path='pdf')
    def assignment_pdf(self, request, pk=None):
        assignment = self.get_object()
        return generate_assignment_pdf(assignment)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsAdminOrTeacher])
    def upload_results(self, request, pk=None):
        """Upload CSV with columns: student_username or student_id and grade."""
        import csv
        from io import TextIOWrapper
        from django.core.files.base import ContentFile
        from django.http import JsonResponse

        # prefer role on profile, fall back to user.role if present
        user_role = None
        try:
            user_role = request.user.profile.role
        except Exception:
            user_role = getattr(request.user, 'role', None)
        if user_role not in ["teacher", "admin", "school_admin", "super_admin"]:
            return Response({"detail": "Not allowed"}, status=403)

        try:
            assignment = self.get_object()
        except Exception:
            return Response({"detail": "Assignment not found"}, status=404)

        uploaded = request.FILES.get('file')
        if not uploaded:
            return Response({"detail": "No file uploaded"}, status=400)

        # support text/csv; decode
        try:
            text_file = TextIOWrapper(uploaded.file, encoding=request.encoding or 'utf-8')
            reader = csv.DictReader(text_file)
        except Exception:
            return Response({"detail": "Invalid CSV"}, status=400)

        created = 0
        updated = 0
        errors = []
        for i, row in enumerate(reader, start=1):
            username = (row.get('student_username') or '').strip()
            sid = (row.get('student_id') or '').strip()
            grade_raw = (row.get('grade') or '').strip()
            if not (username or sid):
                errors.append({"row": i, "error": "no student identifier"})
                continue
            profile = None
            if sid:
                try:
                    from api.core.models import Profile
                    profile = Profile.objects.filter(id=int(sid)).first()
                except Exception:
                    profile = None
            if not profile and username:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                u = User.objects.filter(username=username).first()
                if u:
                    from api.core.models import Profile
                    profile = Profile.objects.filter(user=u).first()
            if not profile:
                errors.append({"row": i, "error": "student not found"})
                continue
            if profile.role != "student":
                errors.append({"row": i, "error": "profile is not a student"})
                continue
            if not assignment.course.enrollments.filter(
                student=profile, status="active"
            ).exists():
                errors.append({"row": i, "error": "student is not enrolled in this course"})
                continue
            try:
                grade = float(grade_raw) if grade_raw != '' else None
            except Exception:
                errors.append({"row": i, "error": "invalid grade"})
                continue
            # find existing submission
            sub_qs = AssignmentSubmission.objects.filter(assignment=assignment, student=profile)
            if sub_qs.exists():
                sub = sub_qs.first()
                sub.grade = grade if grade is not None else sub.grade
                sub.save()
                updated += 1
            else:
                # create a placeholder file so FileField is satisfied
                content = ContentFile(b"imported result")
                content.name = f"imported_{assignment.id}_{profile.user.username}.txt"
                sub = AssignmentSubmission(assignment=assignment, student=profile, grade=(grade or 0.0))
                sub.file.save(content.name, content)
                sub.save()
                created += 1

        return JsonResponse({"created": created, "updated": updated, "errors": errors})


class AssignmentSubmissionViewSet(ModelViewSet):
    queryset = AssignmentSubmission.objects.all()
    serializer_class = AssignmentSubmissionSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in {"update", "partial_update", "destroy", "publish"}:
            return [IsAuthenticated(), IsAdminOrTeacher()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        role = getattr(getattr(user, "profile", None), "role", "")
        if role in ["teacher", "school_admin"]:
            try:
                return qs.filter(assignment__course__department=user.profile.department).order_by("-submitted_at", "-id")
            except Exception:
                return qs.none()
        if role in ["admin", "super_admin"]:
            return qs.order_by("-submitted_at", "-id")
        elif role == "instructor":
            try:
                user_profile = user.profile
                instructor_course_ids = Course.objects.filter(instructor=user_profile).values_list('id', flat=True)
                assignment_ids = Assignment.objects.filter(course_id__in=instructor_course_ids).values_list('id', flat=True)
                return qs.filter(assignment_id__in=assignment_ids).order_by("-submitted_at", "-id")
            except:
                return qs.none()
        return qs.filter(student__user=user, status="published").order_by("-submitted_at", "-id")

    def perform_create(self, serializer):
        profile = getattr(self.request.user, "profile", None)
        if not profile or profile.role != "student":
            raise PermissionDenied("Only students can submit assignments.")
        assignment = serializer.validated_data["assignment"]
        if not accessible_assignments(self.request.user).filter(pk=assignment.pk).exists():
            raise PermissionDenied("You are not enrolled in this assignment's course.")
        serializer.save(student=profile)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsAdminOrTeacher])
    def publish(self, request, pk=None):
        sub = self.get_object()
        role = getattr(getattr(request.user, "profile", None), "role", "")
        if role not in ["teacher", "admin", "school_admin", "super_admin"]:
            return Response({"detail": "Not allowed"}, status=403)
        sub.status = "published"
        sub.save(update_fields=["status"])
        return Response({"status": "published"})

    @action(detail=True, methods=["get"], permission_classes=[IsAuthenticated])
    def pdf(self, request, pk=None):
        from django.http import HttpResponse
        from reportlab.pdfgen import canvas
        sub = self.get_object()
        role = getattr(getattr(request.user, "profile", None), "role", "")
        if sub.status != "published" and role not in ["teacher", "admin", "school_admin", "super_admin"]:
            return Response({"detail": "Not available"}, status=403)
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="assignment_{sub.id}.pdf"'
        p = canvas.Canvas(response)
        p.drawString(100, 800, f"Assignment: {sub.assignment.title}")
        p.drawString(100, 780, f"Student: {sub.student.user.username}")
        p.drawString(100, 760, f"Grade: {sub.grade}")
        p.showPage()
        p.save()
        return response
