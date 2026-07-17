from .auth_views import (
    password_reset_request,
    verify_otp,
    password_reset_confirm,
)
from .user_views import (
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
)
from .core import RegisterView
from .profile import (
    ProfileViewSet,
    EnrollmentViewSet as NewEnrollmentViewSet,
    AuditLogViewSet,
)
from .course import CourseViewSet
from .quiz import QuizViewSet, QuestionViewSet, QuizSubmissionViewSet
from .assignment import AssignmentViewSet, AssignmentSubmissionViewSet
from .payment import PaymentViewSet
from .achievement import AchievementViewSet, ProjectViewSet, MilestoneViewSet
from .ai import AIView
from .analytics import student_analytics
from .admin_views import SyncGroupsView, AdminUserViewSet
from .instructor_views import (
    InstructorProfileViewSet,
    InstructorAssignmentViewSet,
    InstructorStudentManagementViewSet,
    InstructorResultsViewSet,
)
from .student_views import (
    StudentDashboardView,
    StudentCourseViewSet,
    StudentEnrollmentViewSet,
    StudentChatView,
    AnnouncementListView,
)
from api.academics.views.result_views import ResultViewSet, ReportCardViewSet
# replace:
from .analytics import student_analytics
# with:
from .analytics import student_analytics, course_analytics
from .tenant_views import (
    SchoolViewSet, SubscriptionViewSet,
    SchoolRegistrationView, SubscriptionInitializeView, SubscriptionVerifyView,
)

# and add "course_analytics" next to "student_analytics" in __all__
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
    "student_analytics", "course_analytics",
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
    # Tenant / Billing
    "SchoolViewSet", "SubscriptionViewSet",
    "SchoolRegistrationView", "SubscriptionInitializeView", "SubscriptionVerifyView",
]