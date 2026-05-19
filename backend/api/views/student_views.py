# backend/api/views/student_views.py

from django.utils import timezone as tz
from django.contrib.auth import get_user_model
from django.db.models import Q

from rest_framework.views import APIView
from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from api.core.models import Profile, Course, Enrollment
from api.serializers import EnrollmentSerializer

User = get_user_model()


def _student_profile(request):
    """Return the student's Profile or None."""
    try:
        return request.user.profile
    except Exception:
        return None


# ─── StudentDashboardView ─────────────────────────────────────────────────────
class StudentDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = _student_profile(request)
        if not profile:
            return Response({"detail": "Profile not found."}, status=404)

        now = tz.now()
        year = f"{now.year}/{now.year + 1}"
        month = now.month
        term = "First Term" if month <= 4 else "Second Term" if month <= 8 else "Third Term"

        enrollments = Enrollment.objects.filter(
            student=profile
        ).select_related("course", "course__instructor__user").order_by("-enrolled_at")

        # Assignments from enrolled courses
        assignments = []
        try:
            from api.core.models import Assignment
            enrolled_course_ids = enrollments.filter(
                status="active"
            ).values_list("course_id", flat=True)
            raw_assignments = Assignment.objects.filter(
                course_id__in=enrolled_course_ids
            ).select_related("course").order_by("deadline")
            for a in raw_assignments:
                assignments.append({
                    "id": a.id,
                    "title": a.title,
                    "description": getattr(a, "description", "") or "",
                    "deadline": a.deadline.isoformat() if a.deadline else "",
                    "course": a.course_id,
                    "course_title": a.course.title,
                    "max_score": getattr(a, "total_marks", None),
                })
        except Exception:
            pass

        # Fee status
        fee_status = None
        try:
            from api.core.models import FeePayment
            fee = FeePayment.objects.filter(student=profile).order_by("-created_at").first()
            if fee:
                fee_status = {
                    "academic_year": getattr(fee, "academic_year", year),
                    "term": getattr(fee, "term", term),
                    "total_amount": str(getattr(fee, "total_amount", "0")),
                    "amount_paid": str(getattr(fee, "amount_paid", "0")),
                    "balance": str(getattr(fee, "balance", "0")),
                    "status": getattr(fee, "status", "pending"),
                    "due_date": (fee.due_date.isoformat() if getattr(fee, "due_date", None) else ""),
                }
        except Exception:
            pass

        # Instructors for enrolled courses
        instructors = []
        seen_ids = set()
        for enroll in enrollments.filter(status="active"):
            course = enroll.course
            inst = getattr(course, "instructor", None)
            if inst and inst.id not in seen_ids:
                seen_ids.add(inst.id)
                inst_courses = Course.objects.filter(
                    instructor=inst,
                    id__in=enrolled_course_ids,
                ).values_list("title", flat=True)
                instructors.append({
                    "id": inst.user.id,
                    "full_name": f"{inst.user.first_name} {inst.user.last_name}".strip()
                                 or inst.user.username,
                    "username": inst.user.username,
                    "email": inst.user.email or "",
                    "department": inst.department or "",
                    "instructor_type": (
                        getattr(inst, "teacher_type", None) or
                        getattr(inst, "instructor_type", None) or ""
                    ),
                    "course_titles": list(inst_courses),
                })

        # Add/drop tracking
        add_drop_used = 0
        add_drop_remaining = 2
        try:
            term_enrollments = enrollments.filter(
                academic_year=year,
                add_drop_count__gt=0,
            )
            add_drop_used = sum(e.add_drop_count for e in term_enrollments)
            add_drop_remaining = max(0, 2 - add_drop_used)
        except Exception:
            pass

        # Unread messages
        unread = 0
        try:
            from api.core.models import Message
            unread = Message.objects.filter(
                recipient=request.user, is_read=False
            ).count()
        except Exception:
            pass

        enrollment_data = []
        for e in enrollments:
            inst_name = None
            try:
                if e.course.instructor:
                    u = e.course.instructor.user
                    inst_name = f"{u.first_name} {u.last_name}".strip() or u.username
            except Exception:
                pass
            enrollment_data.append({
                "id": e.id,
                "course": e.course_id,
                "course_title": e.course.title,
                "course_department": e.course.department,
                "academic_year": e.academic_year,
                "term": getattr(e, "term", term),
                "status": e.status,
                "enrolled_at": e.enrolled_at.isoformat() if e.enrolled_at else "",
                "add_drop_count": getattr(e, "add_drop_count", 0),
                "drop_history": getattr(e, "drop_history", []) or [],
                "instructor_name": inst_name,
            })

        return Response({
            "student": {
                "id": profile.id,
                "student_id": profile.student_id or "",
                "first_name": request.user.first_name,
                "last_name": request.user.last_name,
                "username": request.user.username,
                "email": request.user.email,
                "department": profile.department or "",
                "student_class": profile.student_class or "",
                "bio": profile.bio or "",
                "phone": profile.phone or "",
            },
            "current_year": year,
            "current_term": term,
            "enrollments": enrollment_data,
            "assignments": assignments,
            "fee_status": fee_status,
            "instructors": instructors,
            "unread_messages": unread,
            "add_drop_used": add_drop_used,
            "add_drop_remaining": add_drop_remaining,
        })


# ─── StudentCourseViewSet ─────────────────────────────────────────────────────
class StudentCourseViewSet(ReadOnlyModelViewSet):
    """
    Lists courses available to the student (dept-filtered) with is_enrolled flag.
    Also provides /enroll/ and /drop/ actions.
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Course.objects.none()
        profile = _student_profile(self.request)
        if not profile:
            return Course.objects.none()
        return Course.objects.filter(
            department=profile.department
        ).select_related("instructor__user").order_by("title")

    def list(self, request, *args, **kwargs):
        profile = _student_profile(request)
        if not profile:
            return Response([])

        courses = self.get_queryset()
        enrolled_ids = set(
            Enrollment.objects.filter(
                student=profile, status="active"
            ).values_list("course_id", flat=True)
        )

        result = []
        for c in courses:
            inst_name = None
            inst_id = None
            try:
                if c.instructor:
                    u = c.instructor.user
                    inst_name = f"{u.first_name} {u.last_name}".strip() or u.username
                    inst_id = u.id
            except Exception:
                pass

            total_students = Enrollment.objects.filter(
                course=c, status="active"
            ).count()

            result.append({
                "id": c.id,
                "title": c.title,
                "description": c.description or "",
                "department": c.department or "",
                "student_class": getattr(c, "student_class", "") or "",
                "instructor_name": inst_name,
                "instructor_id": inst_id,
                "is_enrolled": c.id in enrolled_ids,
                "total_students": total_students,
            })

        return Response(result)

    @action(detail=True, methods=["post"])
    def enroll(self, request, pk=None):
        profile = _student_profile(request)
        if not profile:
            return Response({"detail": "Profile not found."}, status=403)

        try:
            course = Course.objects.get(pk=pk, department=profile.department)
        except Course.DoesNotExist:
            return Response({"detail": "Course not found."}, status=404)

        existing = Enrollment.objects.filter(student=profile, course=course).first()
        if existing:
            if existing.status == "active":
                return Response({"detail": "Already enrolled."}, status=400)
            existing.status = "active"
            if hasattr(existing, "add_drop_count"):
                existing.add_drop_count = (existing.add_drop_count or 0) + 1
            existing.save()
            return Response({"detail": "Re-enrolled successfully."})

        now = tz.now()
        year = f"{now.year}/{now.year + 1}"
        Enrollment.objects.create(
            student=profile,
            course=course,
            academic_year=year,
            status="active",
            enrolled_at=now,
        )
        return Response({"detail": "Enrolled successfully."})

    @action(detail=True, methods=["post"])
    def drop(self, request, pk=None):
        profile = _student_profile(request)
        if not profile:
            return Response({"detail": "Profile not found."}, status=403)

        try:
            enrollment = Enrollment.objects.get(
                student=profile, course_id=pk, status="active"
            )
        except Enrollment.DoesNotExist:
            return Response({"detail": "Not enrolled in this course."}, status=404)

        enrollment.status = "dropped"
        if hasattr(enrollment, "add_drop_count"):
            enrollment.add_drop_count = (enrollment.add_drop_count or 0) + 1
        enrollment.save()
        return Response({"detail": "Course dropped."})


# ─── StudentEnrollmentViewSet ─────────────────────────────────────────────────
class StudentEnrollmentViewSet(ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = EnrollmentSerializer

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Enrollment.objects.none()
        profile = _student_profile(self.request)
        if not profile:
            return Enrollment.objects.none()
        return Enrollment.objects.filter(
            student=profile
        ).select_related("course").order_by("-enrolled_at")


# ─── AnnouncementListView ─────────────────────────────────────────────────────
class AnnouncementListView(APIView):
    """Returns upcoming assignments as announcements for the student's courses."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = _student_profile(request)
        if not profile:
            return Response([])

        announcements = []
        try:
            from api.core.models import Assignment
            enrolled_ids = Enrollment.objects.filter(
                student=profile, status="active"
            ).values_list("course_id", flat=True)

            assignments = Assignment.objects.filter(
                course_id__in=enrolled_ids,
                deadline__gte=tz.now(),
            ).select_related("course").order_by("deadline")[:20]

            for a in assignments:
                announcements.append({
                    "id": str(a.id),
                    "type": "assignment",
                    "title": f"Assignment Due: {a.title}",
                    "body": getattr(a, "description", "") or "",
                    "course": a.course.title,
                    "due": a.deadline.isoformat() if a.deadline else None,
                })
        except Exception:
            pass

        return Response(announcements)


# ─── StudentChatView ──────────────────────────────────────────────────────────
class StudentChatView(APIView):
    """
    GET  /student/chat/           → list conversation threads
    GET  /student/chat/?with=id   → messages with a specific user
    POST /student/chat/           → send a message { recipient: id, message: str }
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        with_id = request.query_params.get("with")
            try:
                from api.core.models import Message
        except ImportError:
            return Response([])

        if with_id:
            # Return message thread with specific user
            messages = Message.objects.filter(
                Q(sender=request.user, recipient_id=with_id) |
                Q(sender_id=with_id, recipient=request.user)
            ).order_by("timestamp")[:100]

            # Mark as read
            messages.filter(recipient=request.user, is_read=False).update(is_read=True)

            result = []
            for m in messages:
                result.append({
                    "id": m.id,
                    "sender": m.sender_id,
                    "sender_name": f"{m.sender.first_name} {m.sender.last_name}".strip()
                                   or m.sender.username,
                    "sender_role": getattr(getattr(m.sender, "profile", None), "role", ""),
                    "recipient": m.recipient_id,
                    "recipient_name": f"{m.recipient.first_name} {m.recipient.last_name}".strip()
                                      or m.recipient.username,
                    "message": m.message,
                    "timestamp": m.timestamp.isoformat(),
                    "is_read": m.is_read,
                })
            return Response(result)

        # Thread list — find all users this student has messaged or been messaged by
        user_ids = set(
            Message.objects.filter(
                Q(sender=request.user) | Q(recipient=request.user)
            ).exclude(
                sender=request.user, recipient=request.user
            ).values_list(
                "sender_id", "recipient_id"
            ).distinct()
            .__iter__()
        )
        # Flatten and deduplicate, removing self
        other_ids = set()
        for s, r in Message.objects.filter(
            Q(sender=request.user) | Q(recipient=request.user)
        ).values_list("sender_id", "recipient_id"):
            if s != request.user.id:
                other_ids.add(s)
            if r != request.user.id:
                other_ids.add(r)

        threads = []
        for uid in other_ids:
            try:
                other = User.objects.get(pk=uid)
                last_msg = Message.objects.filter(
                    Q(sender=request.user, recipient=other) |
                    Q(sender=other, recipient=request.user)
                ).order_by("-timestamp").first()
                unread = Message.objects.filter(
                    sender=other, recipient=request.user, is_read=False
                ).count()
                threads.append({
                    "user_id": other.id,
                    "name": f"{other.first_name} {other.last_name}".strip() or other.username,
                    "role": getattr(getattr(other, "profile", None), "role", "teacher"),
                    "last_message": last_msg.message if last_msg else None,
                    "last_time": last_msg.timestamp.isoformat() if last_msg else None,
                    "unread": unread,
                })
            except User.DoesNotExist:
                continue

        threads.sort(key=lambda t: t["last_time"] or "", reverse=True)
        return Response(threads)

    def post(self, request):
        try:
            from api.core.models import Message
        except ImportError:
            return Response({"detail": "Messaging not available."}, status=501)

        recipient_id = request.data.get("recipient")
        message_text = request.data.get("message", "").strip()

        if not recipient_id or not message_text:
            return Response(
                {"detail": "recipient and message are required."},
                status=400,
            )

        try:
            recipient = User.objects.get(pk=recipient_id)
        except User.DoesNotExist:
            return Response({"detail": "Recipient not found."}, status=404)

        msg = Message.objects.create(
            sender=request.user,
            recipient=recipient,
            message=message_text,
        )
        return Response({
            "id": msg.id,
            "sender": request.user.id,
            "recipient": recipient.id,
            "message": msg.message,
            "timestamp": msg.timestamp.isoformat(),
            "is_read": False,
        }, status=201)