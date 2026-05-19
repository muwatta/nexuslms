from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response

from api.core.models import Assignment, AssignmentSubmission, Course
from api.pdf_utils import generate_assignment_pdf
from api.serializers import (
    AssignmentSerializer,
    AssignmentSubmissionSerializer,
)


class AssignmentViewSet(ModelViewSet):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=["get"], permission_classes=[IsAuthenticated])
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

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
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
        if user_role not in ["teacher", "instructor", "admin"]:
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

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role in ["teacher", "admin"]:
            return qs
        elif user.role == "instructor":
            try:
                user_profile = user.profile
                # Get assignments from courses taught by this instructor
                instructor_course_ids = Course.objects.filter(instructor=user_profile).values_list('id', flat=True)
                assignment_ids = Assignment.objects.filter(course_id__in=instructor_course_ids).values_list('id', flat=True)
                return qs.filter(assignment_id__in=assignment_ids)
            except:
                return qs.none()
        return qs.filter(published=True)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def publish(self, request, pk=None):
        sub = self.get_object()
        if request.user.role not in ["teacher", "instructor", "admin"]:
            return Response({"detail": "Not allowed"}, status=403)
        sub.published = True
        sub.save()
        return Response({"status": "published"})

    @action(detail=True, methods=["get"], permission_classes=[IsAuthenticated])
    def pdf(self, request, pk=None):
        from django.http import HttpResponse
        from reportlab.pdfgen import canvas
        sub = self.get_object()
        if not sub.published and request.user.role not in ["teacher", "instructor", "admin"]:
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
