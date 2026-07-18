# backend/api/models/__init__.py
from .user               import User
from .profile            import Profile
from .course             import Course
from .school             import School
from .subscription       import Subscription
from .assignment         import Assignment
from .submission         import AssignmentSubmission
from .enrollment         import Enrollment
from .quiz               import Quiz, Question
from .quizsubmission     import QuizSubmission
from .feepayment         import FeePayment
from .achievement        import Achievement, Project, Milestone
from .auditlog           import AuditLog
from .studentidsequence  import StudentIDSequence
from .instructorassignment import InstructorAssignment
from .subjectassignment  import SubjectAssignment
from .password_reset     import PasswordResetOTP
from .core               import PracticeQuestion
from .chat               import ChatMessage
from .result             import Result, ReportCard
from .notification       import Notification

__all__ = [
    "User",
    "Profile",
    "School",
    "Subscription",
    "Course",
    "Assignment",
    "AssignmentSubmission",
    "Enrollment",
    "Quiz",
    "Question",
    "QuizSubmission",
    "FeePayment",
    "Achievement",
    "Project",
    "Milestone",
    "AuditLog",
    "StudentIDSequence",
    "InstructorAssignment",
    "SubjectAssignment",
    "PasswordResetOTP",
    "PracticeQuestion",
    "ChatMessage",
    "Result",        
    "ReportCard",
    "Notification",
]