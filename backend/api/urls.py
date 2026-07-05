from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from .views import ai_proxy
from .views.parent_views import ParentDashboardViewSet

from .views.ai import AIChatView

from . import views as auth_view_module
from .views import (
    password_reset_request, verify_otp, password_reset_confirm,
    RegisterView, CustomTokenObtainPairView, CustomTokenRefreshView,
    ProfileViewSet,
    CourseViewSet, QuizViewSet, QuestionViewSet, QuizSubmissionViewSet,
    AssignmentViewSet, AssignmentSubmissionViewSet, PaymentViewSet,
    AchievementViewSet, ProjectViewSet, MilestoneViewSet, AIView,
    student_analytics, NewEnrollmentViewSet, AuditLogViewSet,
    SyncGroupsView, AdminUserViewSet, InstructorProfileViewSet,
    InstructorAssignmentViewSet, InstructorStudentManagementViewSet,
    InstructorResultsViewSet, StudentDashboardView, StudentCourseViewSet,
    StudentEnrollmentViewSet, StudentChatView, AnnouncementListView, course_analytics,
)
from .views.subjectassignment import SubjectAssignmentViewSet
from .views.core import RolesAndPermissionsView
from .views.permissions_view import PermissionsMeView 
from .core.models import Profile

from .views import ResultViewSet, ReportCardViewSet


router = DefaultRouter()

router.register(r"results",      ResultViewSet,     basename="results")
router.register(r"report-cards", ReportCardViewSet, basename="report-cards")

router.register("profiles",               ProfileViewSet,                     basename="profiles")
router.register("enrollments",            NewEnrollmentViewSet,               basename="enrollments")
router.register("audit-logs",             AuditLogViewSet,                    basename="audit-logs")
router.register("admin/users",            AdminUserViewSet,                   basename="admin-users")
router.register("courses",                CourseViewSet,                      basename="courses")
router.register("quizzes",                QuizViewSet,                        basename="quizzes")
router.register("questions",              QuestionViewSet,                    basename="questions")
router.register("quiz-submissions",       QuizSubmissionViewSet,              basename="quiz-submissions")
router.register("assignment-submissions", AssignmentSubmissionViewSet,        basename="assignment-submissions")
router.register("assignments",            AssignmentViewSet,                  basename="assignments")
router.register("payments",               PaymentViewSet,                     basename="payments")
router.register("achievements",           AchievementViewSet,                 basename="achievements")
router.register("projects",               ProjectViewSet,                     basename="projects")
router.register("milestones",             MilestoneViewSet,                   basename="milestones")
router.register("student/courses",        StudentCourseViewSet,               basename="student-courses")
router.register("student/enrollments",    StudentEnrollmentViewSet,           basename="student-enrollments")
router.register("instructor/profiles",    InstructorProfileViewSet,           basename="instructor-profiles")
router.register("instructor/assignments", InstructorAssignmentViewSet,        basename="instructor-assignments")
router.register("instructor/students",    InstructorStudentManagementViewSet, basename="instructor-students")
router.register("instructor/results",     InstructorResultsViewSet,           basename="instructor-results")
router.register("parent", ParentDashboardViewSet, basename="parent")
router.register("subject-assignments",     SubjectAssignmentViewSet,            basename="subject-assignments")



class ClassChoicesByDepartmentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        department = request.query_params.get("department", "western")
        classes = Profile.get_classes_for_department(department)
        return Response({
            "department": department,
            "classes": [{"value": v, "label": l} for v, l in classes],
        })


urlpatterns = [
    path("auth/login/",   auth_view_module.auth_views.secure_login,   name="secure-login"),
    path("auth/refresh/", auth_view_module.auth_views.secure_refresh, name="secure-refresh"),
    path("auth/logout/",  auth_view_module.auth_views.secure_logout,  name="secure-logout"),
    path("auth/status/",  auth_view_module.auth_views.auth_status,    name="auth-status"),
    
    path("register/",      RegisterView.as_view(),              name="register"),
    path("token/",         CustomTokenObtainPairView.as_view(),  name="token_obtain_pair"),
    path("token/refresh/", CustomTokenRefreshView.as_view(),    name="token_refresh"),

    path("auth/password-reset-request/", password_reset_request, name="password_reset_request"),
    path("auth/verify-otp/",             verify_otp,              name="verify_otp"),
    path("auth/password-reset-confirm/", password_reset_confirm,  name="password_reset_confirm"),
   
    path("ai/chat/", ai_proxy.claude_proxy, name="ai-chat"),
    path("permissions/me/", PermissionsMeView.as_view(), name="permissions_me"),
    path("roles-and-permissions/", RolesAndPermissionsView.as_view(), name="roles_and_permissions"),
    path("analytics/student/<str:student_identifier>/", student_analytics, name="student_analytics"),
    path("analytics/course/<str:course_identifier>/", course_analytics, name="course_analytics"),

    path("ai/", AIView.as_view(), name="ai"),
    path("admin/sync-groups/", SyncGroupsView.as_view(), name="sync_groups"),

    path("class-choices/", ClassChoicesByDepartmentView.as_view(), name="class_choices"),
    path("student/dashboard/",     StudentDashboardView.as_view(),  name="student-dashboard"),
    path("student/chat/",          StudentChatView.as_view(),        name="student-chat"),
    
    path("student/announcements/", AnnouncementListView.as_view(),   name="student-announcements"),
    path('ai/chat/', AIChatView.as_view(), name='ai-chat'),

]

urlpatterns += router.urls