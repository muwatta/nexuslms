# backend/api/views/__init__.py

# Auth views
from .auth_views import (
    password_reset_request,
    verify_otp,
    password_reset_confirm,
)
# User views
from .user_views import (
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
)
# Core views
from .core import RegisterView
# Profile views
from .profile import (
    ProfileViewSet,
    EnrollmentViewSet as NewEnrollmentViewSet,
    AuditLogViewSet,
)
# Course views
from .course import CourseViewSet
# Quiz views
from .quiz import QuizViewSet, QuestionViewSet, QuizSubmissionViewSet
# Assignment views
from .assignment import AssignmentViewSet, AssignmentSubmissionViewSet
# Payment views
from .payment import PaymentViewSet
# Achievement views
from .achievement import AchievementViewSet, ProjectViewSet, MilestoneViewSet
# AI views
from .ai import AIView
# Analytics views
from .analytics import student_analytics
# Admin views
from .admin_views import SyncGroupsView, AdminUserViewSet
# Instructor views
from .instructor_views import (
    InstructorProfileViewSet,
    InstructorAssignmentViewSet,
    InstructorStudentManagementViewSet,
    InstructorResultsViewSet,
)
# Student views
from .student_views import (
    StudentDashboardView,
    StudentCourseViewSet,
    StudentEnrollmentViewSet,
    StudentChatView,
    AnnouncementListView,
)
# Result views  ← NEW
from api.academics.views.result_views import ResultViewSet, ReportCardViewSet

__all__ = [
    # Auth
    "password_reset_request", "verify_otp", "password_reset_confirm",
    # User
    "RegisterView", "CustomTokenObtainPairView", "CustomTokenRefreshView",
    "ProfileViewSet",
    # Courses
    "CourseViewSet",
    # Quizzes
    "QuizViewSet", "QuestionViewSet", "QuizSubmissionViewSet",
    # Assignments
    "AssignmentViewSet", "AssignmentSubmissionViewSet",
    # Payments
    "PaymentViewSet",
    # Achievements
    "AchievementViewSet", "ProjectViewSet", "MilestoneViewSet",
    # AI
    "AIView",
    # Analytics
    "student_analytics",
    # Profile / Enrollment
    "NewEnrollmentViewSet", "AuditLogViewSet",
    # Admin
    "SyncGroupsView", "AdminUserViewSet",
    # Instructor
    "InstructorProfileViewSet", "InstructorAssignmentViewSet",
    "InstructorStudentManagementViewSet", "InstructorResultsViewSet",
    # Student
    "StudentDashboardView", "StudentCourseViewSet",
    "StudentEnrollmentViewSet", "StudentChatView", "AnnouncementListView",
    # Results  ← NEW
    "ResultViewSet", "ReportCardViewSet",
]