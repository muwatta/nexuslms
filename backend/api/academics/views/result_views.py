from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.db.models import Avg, Count, Q
from django.utils import timezone

from api.models import Profile, Course, Result, ReportCard
from api.academics.serializers.result import (
    ResultSerializer,
    ResultWriteSerializer,
    BulkResultSerializer,
)
from api.academics.serializers.report_card import ReportCardSerializer


class ResultViewSet(viewsets.ModelViewSet):
    """
    CRUD for results.

    - Teachers see only results they entered.
    - Class teachers see all results for their class.
    - Admins see everything.
    - Students see only their own published results.
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return ResultWriteSerializer
        return ResultSerializer

    def get_queryset(self):
        user    = self.request.user
        profile = getattr(user, "profile", None)
        if not profile:
            return Result.objects.none()

        role = profile.role

        if role in ("admin", "super_admin", "school_admin"):
            qs = Result.objects.all()
        elif role == "teacher":
            teacher_type = getattr(profile, "teacher_type", None)
            if teacher_type == "class":
                qs = Result.objects.filter(
                    student_class=profile.student_class or "",
                )
            else:
                qs = Result.objects.filter(entered_by=profile)
        elif role == "student":
            qs = Result.objects.filter(student=profile, status="published")
        elif role == "parent":
            children = Profile.objects.filter(
                role="student",
                parent_email=user.email,
            )
            qs = Result.objects.filter(student__in=children, status="published")
        else:
            return Result.objects.none()

        params = self.request.query_params
        if params.get("term"):
            qs = qs.filter(term=params["term"])
        if params.get("academic_year"):
            qs = qs.filter(academic_year=params["academic_year"])
        if params.get("course"):
            qs = qs.filter(course_id=params["course"])
        if params.get("student"):
            qs = qs.filter(student_id=params["student"])
        if params.get("status"):
            qs = qs.filter(status=params["status"])
        if params.get("student_class"):
            qs = qs.filter(student_class=params["student_class"])

        return qs.select_related(
            "student__user", "course", "entered_by__user"
        )

    def perform_create(self, serializer):
        profile = getattr(self.request.user, "profile", None)
        student = serializer.validated_data.get("student")
        serializer.save(
            entered_by=profile,
            student_class=getattr(student, "student_class", "") or "",
        )

    def perform_update(self, serializer):
        instance = serializer.instance
        if instance.status not in ("draft",):
            raise serializers.ValidationError(
                "Cannot edit a result that has already been submitted."
            )
        serializer.save()

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        result  = self.get_object()
        profile = getattr(request.user, "profile", None)

        if result.entered_by != profile and profile.role not in ("admin", "super_admin"):
            return Response(
                {"detail": "Only the entering teacher can submit this result."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if result.status != "draft":
            return Response(
                {"detail": f"Cannot submit — current status is '{result.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        result.status       = "submitted"
        result.submitted_at = timezone.now()
        result.save()
        return Response({"detail": "Result submitted for review.", "status": "submitted"})

    @action(detail=True, methods=["post"])
    def review(self, request, pk=None):
        result  = self.get_object()
        profile = getattr(request.user, "profile", None)

        if profile.role not in ("teacher", "admin", "super_admin", "school_admin"):
            return Response(
                {"detail": "Only teachers or admins can review results."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if result.status != "submitted":
            return Response(
                {"detail": f"Cannot review — current status is '{result.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        result.status      = "reviewed"
        result.reviewed_by = profile
        result.reviewed_at = timezone.now()
        result.save()
        return Response({"detail": "Result reviewed.", "status": "reviewed"})

    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        result  = self.get_object()
        profile = getattr(request.user, "profile", None)

        if profile.role not in ("admin", "super_admin", "school_admin"):
            return Response(
                {"detail": "Only admins can publish results."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if result.status not in ("reviewed", "submitted"):
            return Response(
                {"detail": f"Cannot publish — current status is '{result.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        result.status       = "published"
        result.published_by = request.user
        result.published_at = timezone.now()
        result.save()
        return Response({"detail": "Result published.", "status": "published"})

    @action(detail=False, methods=["get"])
    def class_results(self, request):
        student_class = request.query_params.get("student_class")
        term          = request.query_params.get("term")
        academic_year = request.query_params.get("academic_year")

        if not all([student_class, term, academic_year]):
            return Response(
                {"detail": "student_class, term, and academic_year are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        results = Result.objects.filter(
            student_class=student_class,
            term=term,
            academic_year=academic_year,
        ).select_related("student__user", "course", "entered_by__user")

        serializer = ResultSerializer(results, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["post"])
    def bulk_entry(self, request):
        serializer = BulkResultSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        profile       = getattr(request.user, "profile", None)
        course_id     = serializer.validated_data["course"]
        term          = serializer.validated_data["term"]
        academic_year = serializer.validated_data["academic_year"]
        entries       = serializer.validated_data["results"]

        try:
            course = Course.objects.get(pk=course_id)
        except Course.DoesNotExist:
            return Response(
                {"detail": "Course not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        created = []
        updated = []
        errors  = []

        with transaction.atomic():
            for entry in entries:
                student_id = entry.get("student")
                try:
                    student = Profile.objects.get(pk=student_id, role="student")
                except Profile.DoesNotExist:
                    errors.append({"student": student_id, "error": "Student not found."})
                    continue

                result, was_created = Result.objects.update_or_create(
                    student=student,
                    course=course,
                    term=term,
                    academic_year=academic_year,
                    defaults={
                        "test1":       float(entry.get("test1", 0)),
                        "test2":       float(entry.get("test2", 0)),
                        "assignment":  float(entry.get("assignment", 0)),
                        "midterm":     float(entry.get("midterm", 0)),
                        "exam":        float(entry.get("exam", 0)),
                        "remark":      entry.get("remark", ""),
                        "entered_by":  profile,
                        "student_class": student.student_class or "",
                        "status":      "draft",
                    },
                )
                if was_created:
                    created.append(result.id)
                else:
                    updated.append(result.id)

        return Response({
            "detail": f"{len(created)} created, {len(updated)} updated, {len(errors)} errors.",
            "created": created,
            "updated": updated,
            "errors":  errors,
        })

    @action(detail=False, methods=["post"])
    def compute_positions(self, request):
        profile = getattr(request.user, "profile", None)
        if profile.role not in ("admin", "super_admin", "school_admin"):
            return Response(
                {"detail": "Only admins can compute positions."},
                status=status.HTTP_403_FORBIDDEN,
            )

        student_class = request.data.get("student_class")
        term          = request.data.get("term")
        academic_year = request.data.get("academic_year")

        if not all([student_class, term, academic_year]):
            return Response(
                {"detail": "student_class, term, and academic_year are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        courses = Course.objects.filter(student_class=student_class)
        updated = 0

        with transaction.atomic():
            for course in courses:
                results = Result.objects.filter(
                    course=course,
                    term=term,
                    academic_year=academic_year,
                    status__in=["reviewed", "published"],
                ).order_by("-total")

                for position, result in enumerate(results, start=1):
                    result.position = position
                    result.save(update_fields=["position"])
                    updated += 1

        return Response({
            "detail": f"Positions computed for {updated} results.",
            "student_class": student_class,
            "term": term,
            "academic_year": academic_year,
        })


class ReportCardViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only for students/parents.
    Admins can generate and publish report cards.
    """
    permission_classes = [IsAuthenticated]
    serializer_class   = ReportCardSerializer

    def get_queryset(self):
        user    = self.request.user
        profile = getattr(user, "profile", None)
        if not profile:
            return ReportCard.objects.none()

        role = profile.role

        if role in ("admin", "super_admin", "school_admin"):
            qs = ReportCard.objects.all()
        elif role == "teacher":
            qs = ReportCard.objects.filter(
                student_class=getattr(profile, "student_class", "") or ""
            )
        elif role == "student":
            qs = ReportCard.objects.filter(student=profile, is_published=True)
        elif role == "parent":
            children = Profile.objects.filter(
                role="student", parent_email=user.email
            )
            qs = ReportCard.objects.filter(
                student__in=children, is_published=True
            )
        else:
            return ReportCard.objects.none()

        params = self.request.query_params
        if params.get("term"):
            qs = qs.filter(term=params["term"])
        if params.get("academic_year"):
            qs = qs.filter(academic_year=params["academic_year"])
        if params.get("student"):
            qs = qs.filter(student_id=params["student"])

        return qs.select_related("student__user")

    @action(detail=False, methods=["post"])
    def generate(self, request):
        profile = getattr(request.user, "profile", None)
        if profile.role not in ("admin", "super_admin", "school_admin"):
            return Response(
                {"detail": "Only admins can generate report cards."},
                status=status.HTTP_403_FORBIDDEN,
            )

        student_class = request.data.get("student_class")
        term          = request.data.get("term")
        academic_year = request.data.get("academic_year")
        resumption    = request.data.get("resumption_date")

        if not all([student_class, term, academic_year]):
            return Response(
                {"detail": "student_class, term, and academic_year are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        students = Profile.objects.filter(
            role="student",
            student_class=student_class,
        )

        generated = []

        with transaction.atomic():
            student_scores = []
            for student in students:
                results = Result.objects.filter(
                    student=student,
                    term=term,
                    academic_year=academic_year,
                    status="published",
                )
                if not results.exists():
                    continue

                total_score    = sum(r.total for r in results)
                total_subjects = results.count()
                average_score  = round(total_score / total_subjects, 2) if total_subjects else 0

                student_scores.append({
                    "student":        student,
                    "total_score":    total_score,
                    "total_subjects": total_subjects,
                    "average_score":  average_score,
                })

            student_scores.sort(key=lambda x: x["total_score"], reverse=True)
            class_size = len(student_scores)

            for position, data in enumerate(student_scores, start=1):
                card, _ = ReportCard.objects.update_or_create(
                    student=data["student"],
                    term=term,
                    academic_year=academic_year,
                    defaults={
                        "student_class":    student_class,
                        "total_subjects":   data["total_subjects"],
                        "total_score":      data["total_score"],
                        "average_score":    data["average_score"],
                        "position_in_class": position,
                        "class_size":       class_size,
                        "resumption_date":  resumption,
                    },
                )
                generated.append(card.id)

        return Response({
            "detail": f"{len(generated)} report cards generated.",
            "student_class": student_class,
            "term":          term,
            "academic_year": academic_year,
        })

    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        profile = getattr(request.user, "profile", None)
        if profile.role not in ("admin", "super_admin", "school_admin"):
            return Response(
                {"detail": "Only admins can publish report cards."},
                status=status.HTTP_403_FORBIDDEN,
            )
        card = self.get_object()
        card.publish(by_user=request.user)
        return Response({"detail": "Report card published."})

    @action(detail=False, methods=["post"])
    def publish_all(self, request):
        profile = getattr(request.user, "profile", None)
        if profile.role not in ("admin", "super_admin", "school_admin"):
            return Response(
                {"detail": "Only admins can publish report cards."},
                status=status.HTTP_403_FORBIDDEN,
            )

        student_class = request.data.get("student_class")
        term          = request.data.get("term")
        academic_year = request.data.get("academic_year")

        if not all([student_class, term, academic_year]):
            return Response(
                {"detail": "student_class, term, and academic_year are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        now     = timezone.now()
        updated = ReportCard.objects.filter(
            student_class=student_class,
            term=term,
            academic_year=academic_year,
            is_published=False,
        ).update(
            is_published=True,
            published_at=now,
            published_by=request.user,
        )

        return Response({"detail": f"{updated} report cards published."})
