from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.utils import timezone

from backend.api.core.models import Quiz, QuizSubmission, Question, Course
from api.pdf_utils import generate_quiz_result_pdf
from api.serializers import QuizSerializer, QuizSubmissionSerializer, QuestionSerializer
from api.filters import QuizFilter


class QuizViewSet(ModelViewSet):
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    permission_classes = [IsAuthenticated]
    filterset_class = QuizFilter


class QuestionViewSet(ModelViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        user = self.request.user
        # role may be on user or profile; accept either
        role = getattr(user, 'role', None) or (getattr(user, 'profile', None) and user.profile.role)
        if role not in ["instructor", "teacher", "admin"]:
            raise PermissionDenied("Only instructors/teachers can add questions")
        # if the caller didn't supply an explicit order, auto-increment
        quiz = serializer.validated_data.get('quiz')
        if 'order' not in serializer.validated_data or serializer.validated_data.get('order') is None:
            from django.db.models import Max
            max_ord = Question.objects.filter(quiz=quiz).aggregate(Max('order'))['order__max']
            serializer.save(order=(max_ord or 0) + 1)
        else:
            serializer.save()


class QuizSubmissionViewSet(ModelViewSet):
    queryset = QuizSubmission.objects.all()
    serializer_class = QuizSubmissionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        role = getattr(user, 'profile', None) and user.profile.role
        if role == 'instructor':
            try:
                user_profile = user.profile
                instructor_course_ids = Course.objects.filter(instructor=user_profile).values_list('id', flat=True)
                quiz_ids = Quiz.objects.filter(course_id__in=instructor_course_ids).values_list('id', flat=True)
                return qs.filter(quiz_id__in=quiz_ids)
            except Exception:
                return qs.none()
        if role == 'admin':
            return qs
        return qs.filter(published=True)

    def perform_create(self, serializer):
        user_profile = self.request.user.profile
        
        if user_profile.role != 'student':
            raise ValidationError("Only students can submit quizzes")
        
        quiz = serializer.validated_data.get('quiz')
        answers = serializer.validated_data.get('answers', [])
        
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
        
        # support two answer formats: list of {question_id, selected_index}
        # or simple dict of question_id->selected_index
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
        
        # Direct lookup like pdf action
        try:
            submission = QuizSubmission.objects.get(pk=pk)
        except QuizSubmission.DoesNotExist:
            return Response({"detail": "Not found"}, status=404)
        
        role = getattr(request.user, 'profile', None) and request.user.profile.role
        
        # Permission check
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