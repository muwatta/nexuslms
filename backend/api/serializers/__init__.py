# backend/api/serializers/__init__.py

from .profile import (
    ProfileSerializer,
    ProfileCreateUpdateSerializer,
    InstructorAssignmentSerializer,   # backwards compat — kept
    SubjectAssignmentSerializer,      # new
    EnrollmentSerializer,
    AuditLogSerializer,
    ArchiveRestoreSerializer,
    PromoteStudentSerializer,
)
from .course import (
    CourseSerializer,
    PracticeQuestionSerializer,
)
from .assignment import (
    AssignmentSerializer,
    AssignmentSubmissionSerializer,
)
from .quiz import (
    QuizSerializer,
    QuestionSerializer,
    QuizSubmissionSerializer,
)
from .payment import PaymentSerializer
from .user import UserRegistrationSerializer
from .achievement import (
    AchievementSerializer,
    ProjectSerializer,
    MilestoneSerializer,
)
from .tenant import (
    SchoolSerializer,
    SchoolRegistrationSerializer,
    SubscriptionSerializer,
    SubscriptionInitSerializer,
)

__all__ = [
    # Profile
    "ProfileSerializer",
    "ProfileCreateUpdateSerializer",
    "InstructorAssignmentSerializer",
    "SubjectAssignmentSerializer",
    "EnrollmentSerializer",
    "AuditLogSerializer",
    "ArchiveRestoreSerializer",
    "PromoteStudentSerializer",
    # Course
    "CourseSerializer",
    "PracticeQuestionSerializer",
    # Assignment
    "AssignmentSerializer",
    "AssignmentSubmissionSerializer",
    # Quiz
    "QuizSerializer",
    "QuestionSerializer",
    "QuizSubmissionSerializer",
    # Payment
    "PaymentSerializer",
    # User
    "UserRegistrationSerializer",
    # Achievement
    "AchievementSerializer",
    "ProjectSerializer",
    "MilestoneSerializer",
    # Tenant / Billing
    "SchoolSerializer",
    "SchoolRegistrationSerializer",
    "SubscriptionSerializer",
    "SubscriptionInitSerializer",
]