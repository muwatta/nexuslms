from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.utils import timezone

from api.core.models import Quiz, QuizSubmission, Question, Course
from api.pdf_utils import generate_quiz_result_pdf
from api.serializers import QuizSerializer, QuizSubmissionSerializer, QuestionSerializer
from api.filters import QuizFilter
from api.permissions import IsAdminOrTeacher


def accessible_courses(user):
    profile = getattr(user, "profile", None)
    if not profile:
        return Course.objects.none()
    if user.is_superuser or profile.role in {"admin", "super_admin"}:
        return Course.objects.all()
    if profile.role == "school_admin":
        return Course.objects.filter(department=profile.department)
    if profile.role == "teacher":
        return Course.objects.filter(department=profile.department)
    if profile.role == "student":
        return Course.objects.filter(
            enrollments__student=profile, enrollments__status="active"
        ).distinct()
    return Course.objects.none()


class QuizViewSet(ModelViewSet):
    serializer_class = QuizSerializer
    filterset_class = QuizFilter

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update", "destroy"}:
            return [IsAuthenticated(), IsAdminOrTeacher()]
        return [IsAuthenticated()]

    def get_queryset(self):
        return (
            Quiz.objects.filter(course__in=accessible_courses(self.request.user))
            .prefetch_related("questions")
            .order_by("-created_at", "-id")
        )

    def perform_create(self, serializer):
        if not accessible_courses(self.request.user).filter(pk=serializer.validated_data["course"].pk).exists():
            raise PermissionDenied("You cannot create a quiz for this course.")
        serializer.save()

    def perform_update(self, serializer):
        if not accessible_courses(self.request.user).filter(pk=serializer.instance.course_id).exists():
            raise PermissionDenied("You cannot modify this quiz.")
        serializer.save()


class QuestionViewSet(ModelViewSet):
    serializer_class = QuestionSerializer

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update", "destroy"}:
            return [IsAuthenticated(), IsAdminOrTeacher()]
        return [IsAuthenticated()]

    def get_queryset(self):
        return Question.objects.filter(quiz__course__in=accessible_courses(self.request.user))
    
    def perform_create(self, serializer):
        user = self.request.user
        quiz = serializer.validated_data.get('quiz')
        if not accessible_courses(user).filter(pk=quiz.course_id).exists():
            raise PermissionDenied("You cannot add questions to this quiz.")
        if 'order' not in serializer.validated_data or serializer.validated_data.get('order') is None:
            from django.db.models import Max
            max_ord = Question.objects.filter(quiz=quiz).aggregate(Max('order'))['order__max']
            serializer.save(order=(max_ord or 0) + 1)
        else:
            serializer.save()

    def perform_update(self, serializer):
        if not accessible_courses(self.request.user).filter(pk=serializer.instance.quiz.course_id).exists():
            raise PermissionDenied("You cannot modify this question.")
        serializer.save()


class QuizSubmissionViewSet(ModelViewSet):
    queryset = QuizSubmission.objects.all()
    serializer_class = QuizSubmissionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        profile = getattr(user, 'profile', None)
        role = profile.role if profile else None
        if role == 'teacher':
            return qs.filter(quiz__course__department=profile.department).order_by("-submitted_at", "-id")
        if role in {'admin', 'super_admin'}:
            return qs.order_by("-submitted_at", "-id")
        if profile:
            return qs.filter(student=profile, published=True).order_by("-submitted_at", "-id")
        return qs.none()

    def perform_create(self, serializer):
        try:
            user_profile = self.request.user.profile
        except Exception:
            raise ValidationError("User profile not found")
        
        if user_profile.role != 'student':
            raise ValidationError("Only students can submit quizzes")
        
        quiz = serializer.validated_data.get('quiz')
        answers = serializer.validated_data.get('answers', [])

        if not accessible_courses(self.request.user).filter(pk=quiz.pk).exists():
            raise PermissionDenied("You are not enrolled in this quiz's course")
        
        if QuizSubmission.objects.filter(student=user_profile, quiz=quiz).exists():
            raise ValidationError("Already submitted this quiz")
        
        score = self.calculate_score(quiz, answers)
        
        serializer.save(
            student=user_profile,
            score=score,
            published=False,
            started_at=timezone.now(),
        )
    
    def calculate_score(self, quiz, answers):
        score = 0
        questions = {q.id: q for q in Question.objects.filter(quiz=quiz)}
        
        if isinstance(answers, dict):
            for qid_str, sel in answers.items():
                try:
                    qid = int(qid_str)
                except Exception:
                    continue
                if qid in questions and sel == questions[qid].correct_index:
                    score += questions[qid].marks
            return score
        
        for answer in answers:
            if not isinstance(answer, dict):
                continue
            qid = answer.get('question_id')
            selected_index = answer.get('selected_index', -1) 
            
            if qid in questions:
                question = questions[qid]
                if selected_index == question.correct_index:
                    score += question.marks
        
        return score  

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def publish(self, request, pk=None):
        from rest_framework.response import Response
        
        try:
            submission = QuizSubmission.objects.get(pk=pk)
        except QuizSubmission.DoesNotExist:
            return Response({"detail": "Not found"}, status=404)
        
        role = getattr(request.user, 'profile', None) and request.user.profile.role
        
        if role not in ["instructor", "admin"]:
            return Response({"detail": "Not allowed"}, status=403)
        
        submission.published = True
        submission.save()
        return Response({"status": "published"})

    @action(detail=True, methods=["get"], permission_classes=[IsAuthenticated], url_path='result/pdf')
    def result_pdf(self, request, pk=None):
    
        try:
            sub = QuizSubmission.objects.get(pk=pk)
        except QuizSubmission.DoesNotExist:
            return Response({"detail": "Not found"}, status=404)
        
        role = getattr(request.user, 'profile', None) and request.user.profile.role
        student_profile = getattr(request.user, 'profile', None)
        if not sub.published and role not in ["instructor", "admin"] and sub.student != student_profile:
            return Response({"detail": "Not available"}, status=403)

        return generate_quiz_result_pdf(sub)
