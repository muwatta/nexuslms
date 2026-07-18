"""
Email notification service for NexusLMS.
Sends emails for enrollment, grades, assignments, and payments.
"""
import logging
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from api.core.models import Notification

logger = logging.getLogger(__name__)


def _send_email(subject, html_message, recipient_list):
    """Send an HTML email. Logs failure instead of raising."""
    plain = strip_tags(html_message)
    try:
        send_mail(
            subject=subject,
            message=plain,
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@muwata.com"),
            html_message=html_message,
            recipient_list=recipient_list,
            fail_silently=True,
        )
    except Exception:
        logger.exception("Failed to send email to %s", recipient_list)


def _create_notification(user, title, message, level="info", url=""):
    """Create an in-app notification record."""
    Notification.objects.create(
        recipient=user,
        title=title,
        message=message,
        level=level,
        url=url,
    )
    # Push to WebSocket
    try:
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync

        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                f"user_{user.id}_notifications",
                {"type": "notification.message", "message": message},
            )
    except Exception:
        pass


# ── Enrollment Notifications ──────────────────────────────────────────────────

def notify_enrollment(enrollment):
    """Notify student (and parent) about new enrollment."""
    student_user = enrollment.student.user
    course_title = enrollment.course.title
    year = enrollment.academic_year
    term = getattr(enrollment, "term", "")

    title = f"Enrolled in {course_title}"
    message = f"You have been enrolled in {course_title} ({year} {term})."

    _create_notification(student_user, title, message, level="success", url="/student-dashboard")

    email = student_user.email
    if email:
        _send_email(
            subject=f"NexusLMS — {title}",
            html_message=f"<p>Dear {student_user.first_name or student_user.username},</p>"
                         f"<p>{message}</p>"
                         f"<p>Log in to your dashboard to view details.</p>",
            recipient_list=[email],
        )

    # Notify parent if exists
    parent_email = getattr(enrollment.student, "parent_email", "")
    if parent_email:
        _send_email(
            subject=f"NexusLMS — {title}",
            html_message=f"<p>Dear Parent/Guardian,</p>"
                         f"<p>Your child <strong>{student_user.get_full_name() or student_user.username}</strong> "
                         f"has been enrolled in <strong>{course_title}</strong> ({year} {term}).</p>",
            recipient_list=[parent_email],
        )


# ── Grade Notifications ───────────────────────────────────────────────────────

def notify_grade_published(result):
    """Notify student when a result/grade is published."""
    student_user = result.student.user
    course_title = result.course.title if hasattr(result, "course") and result.course else "your course"
    score = result.score if hasattr(result, "score") else ""
    remark = result.remark if hasattr(result, "remark") else ""

    title = f"Grade Published — {course_title}"
    message = f"Your score for {course_title} has been published."
    if score:
        message += f" Score: {score}."
    if remark:
        message += f" Remark: {remark}."

    _create_notification(student_user, title, message, level="info", url="/student-dashboard")

    email = student_user.email
    if email:
        _send_email(
            subject=f"NexusLMS — {title}",
            html_message=f"<p>Dear {student_user.first_name or student_user.username},</p>"
                         f"<p>{message}</p>",
            recipient_list=[email],
        )


# ── Assignment Notifications ──────────────────────────────────────────────────

def notify_assignment_created(assignment):
    """Notify enrolled students about a new assignment."""
    course = assignment.course
    title = f"New Assignment: {assignment.title}"
    message = f"A new assignment has been posted for {course.title}. Due: {assignment.due_date}."

    # Notify all active students in the course
    from api.core.models import Enrollment

    enrollments = Enrollment.objects.filter(
        course=course, status="active"
    ).select_related("student__user")

    for enrollment in enrollments:
        student_user = enrollment.student.user
        _create_notification(student_user, title, message, level="info", url="/assignments")

        email = student_user.email
        if email:
            _send_email(
                subject=f"NexusLMS — {title}",
                html_message=f"<p>Dear {student_user.first_name or student_user.username},</p>"
                             f"<p>{message}</p>",
                recipient_list=[email],
            )


def notify_assignment_graded(submission):
    """Notify student when their assignment submission is graded."""
    student_user = submission.student.user
    assignment_title = submission.assignment.title
    score = submission.score if hasattr(submission, "score") and submission.score is not None else ""

    title = f"Assignment Graded: {assignment_title}"
    message = f"Your submission for '{assignment_title}' has been graded."
    if score:
        message += f" Score: {score}."

    _create_notification(student_user, title, message, level="success", url="/assignments")

    email = student_user.email
    if email:
        _send_email(
            subject=f"NexusLMS — {title}",
            html_message=f"<p>Dear {student_user.first_name or student_user.username},</p>"
                         f"<p>{message}</p>",
            recipient_list=[email],
        )


# ── Payment Notifications ─────────────────────────────────────────────────────

def notify_payment_received(payment, amount):
    """Notify student about a received payment."""
    student_user = payment.student.user

    title = "Payment Received"
    message = f"₦{amount:,.2f} has been received. Balance: ₦{payment.balance:,.2f}."

    _create_notification(student_user, title, message, level="success", url="/payments")

    email = student_user.email
    if email:
        _send_email(
            subject=f"NexusLMS — {title}",
            html_message=f"<p>Dear {student_user.first_name or student_user.username},</p>"
                         f"<p>{message}</p>",
            recipient_list=[email],
        )
