from django.contrib import admin
from django.utils.html import format_html, mark_safe
from django.db.models import Avg, Count
from backend.api.core.models import (
    Quiz,
    Question,
    QuizSubmission,
)

# ── Try importing Assignment models (may not exist yet) ───────────────────────
try:
    from backend.api.core.models import Assignment, AssignmentSubmission
    HAS_ASSIGNMENTS = True
except ImportError:
    HAS_ASSIGNMENTS = False


# ─────────────────────────────────────────────────────────────────────────────
# Quiz  (guard: skip if already registered by legacy admin.py)
# ─────────────────────────────────────────────────────────────────────────────

# Unregister first if already registered by an old admin.py
# Unregister any models pre-registered by a legacy admin.py
_MODELS_TO_UNREGISTER = [Quiz, QuizSubmission]
if HAS_ASSIGNMENTS:
    _MODELS_TO_UNREGISTER += [Assignment, AssignmentSubmission]
for _model in _MODELS_TO_UNREGISTER:
    try:
        admin.site.unregister(_model)
    except admin.sites.NotRegistered:
        pass

class QuestionInline(admin.TabularInline):
    model = Question
    extra = 1
    fields = ("order", "text", "choices", "correct_index", "marks")
    ordering = ("order",)


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "course_display",
        "total_marks",
        "duration_display",
        "question_count",
        "submission_count",
        "avg_score_display",
        "created_at",
    )
    list_filter = (
        ("course", admin.RelatedOnlyFieldListFilter),
        "course__department",
    )
    search_fields = ("title", "description", "course__title")
    date_hierarchy = "created_at"
    readonly_fields = ("created_at", "updated_at")
    inlines = [QuestionInline]
    list_select_related = ("course",)

    fieldsets = (
        (None, {
            "fields": ("title", "description", "course"),
        }),
        ("Settings", {
            "fields": ("total_marks", "duration"),
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .select_related("course")
            .annotate(
                _question_count=Count("questions", distinct=True),
                _submission_count=Count("quizsubmission", distinct=True),
                _avg_score=Avg("quizsubmission__score"),
            )
        )

    @admin.display(description="Course", ordering="course__title")
    def course_display(self, obj):
        dept_colours = {
            "western":     "#1976d2",
            "arabic":      "#388e3c",
            "programming": "#7b1fa2",
        }
        colour = dept_colours.get(obj.course.department or "", "#757575")
        return format_html(
            '{}&nbsp;<span style="color:{};font-size:0.82em">({})</span>',
            obj.course.title,
            colour,
            obj.course.get_department_display(),
        )

    @admin.display(description="Duration", ordering="duration")
    def duration_display(self, obj):
        if obj.duration:
            return format_html(
                '<span style="color:#1565c0">{} min</span>',
                obj.duration,
            )
        return mark_safe('<span style="color:#9e9e9e">Unlimited</span>')

    @admin.display(description="Questions", ordering="_question_count")
    def question_count(self, obj):
        return format_html(
            '<span style="font-weight:600">{}</span>',
            obj._question_count,
        )

    @admin.display(description="Submissions", ordering="_submission_count")
    def submission_count(self, obj):
        return format_html(
            '<span style="color:#1565c0;font-weight:600">{}</span>',
            obj._submission_count,
        )

    @admin.display(description="Avg Score", ordering="_avg_score")
    def avg_score_display(self, obj):
        avg = obj._avg_score
        if avg is None:
            return mark_safe('<span style="color:#9e9e9e">—</span>')
        pct = (avg / obj.total_marks * 100) if obj.total_marks else 0
        colour = "#388e3c" if pct >= 60 else "#f57c00" if pct >= 40 else "#c62828"
        return format_html(
            '<span style="color:{};font-weight:600">{:.1f} ({:.0f}%)</span>',
            colour,
            avg,
            pct,
        )


# ─────────────────────────────────────────────────────────────────────────────
# Quiz Submission
# ─────────────────────────────────────────────────────────────────────────────

@admin.register(QuizSubmission)
class QuizSubmissionAdmin(admin.ModelAdmin):
    list_display = (
        "student_display",
        "quiz_display",
        "score_badge",
        "pass_fail",
        "published_badge",
        "time_taken_display",
        "submitted_at",
    )
    list_filter = (
        "published",
        ("quiz__course", admin.RelatedOnlyFieldListFilter),
        "quiz__course__department",
        ("quiz", admin.RelatedOnlyFieldListFilter),
    )
    search_fields = (
        "student__user__username",
        "student__user__first_name",
        "student__user__last_name",
        "quiz__title",
        "quiz__course__title",
    )
    date_hierarchy = "submitted_at"
    readonly_fields = (
        "submitted_at",
        "created_at",
        "score",
        "answers_display",
    )
    list_select_related = (
        "student__user",
        "quiz__course",
    )
    list_editable = ()   # removed "published" — use the publish/unpublish actions instead
    actions = [
        "publish_results",
        "unpublish_results",
        "recalculate_scores",
    ]

    fieldsets = (
        ("Submission Info", {
            "fields": ("student", "quiz", "submitted_at", "created_at"),
        }),
        ("Results", {
            "fields": ("score", "published"),
        }),
        ("Answers", {
            "fields": ("answers_display",),
            "classes": ("collapse",),
            "description": "Raw answers submitted by the student.",
        }),
    )

    # ── Display methods ───────────────────────────────────────────────────────

    @admin.display(description="Student", ordering="student__user__username")
    def student_display(self, obj):
        sid = getattr(obj.student, "student_id", "") or ""
        name = (
            f"{obj.student.user.first_name} {obj.student.user.last_name}".strip()
            or obj.student.user.username
        )
        return format_html(
            '{}&nbsp;<span style="color:#757575;font-size:0.82em">{}</span>',
            name,
            sid,
        )

    @admin.display(description="Quiz", ordering="quiz__title")
    def quiz_display(self, obj):
        dept_colours = {
            "western":     "#1976d2",
            "arabic":      "#388e3c",
            "programming": "#7b1fa2",
        }
        colour = dept_colours.get(obj.quiz.course.department or "", "#757575")
        return format_html(
            '{}&nbsp;<span style="color:{};font-size:0.82em">({})</span>',
            obj.quiz.title,
            colour,
            obj.quiz.course.title,
        )

    @admin.display(description="Score", ordering="score")
    def score_badge(self, obj):
        if obj.score is None:
            return mark_safe('<span style="color:#9e9e9e">Not graded</span>')
        total = obj.quiz.total_marks or 1
        pct = obj.score / total * 100
        colour = "#388e3c" if pct >= 60 else "#f57c00" if pct >= 40 else "#c62828"
        bg = "#e8f5e9" if pct >= 60 else "#fff3e0" if pct >= 40 else "#ffebee"
        return format_html(
            '<span style="background:{};color:{};padding:2px 10px;'
            'border-radius:12px;font-size:0.82em;font-weight:600">'
            '{:.1f} / {}</span>',
            bg, colour, obj.score, total,
        )

    @admin.display(description="Result")
    def pass_fail(self, obj):
        if obj.score is None:
            return mark_safe('<span style="color:#9e9e9e">—</span>')
        total = obj.quiz.total_marks or 1
        pct = obj.score / total * 100
        if pct >= 60:
            return mark_safe(
                '<span style="background:#388e3c;color:#fff;padding:2px 10px;'
                'border-radius:12px;font-size:0.82em">✓ Pass</span>'
            )
        return mark_safe(
            '<span style="background:#c62828;color:#fff;padding:2px 10px;'
            'border-radius:12px;font-size:0.82em">✗ Fail</span>'
        )

    @admin.display(description="Published", boolean=False, ordering="published")
    def published_badge(self, obj):
        if obj.published:
            return mark_safe(
                '<span style="background:#1565c0;color:#fff;padding:2px 8px;'
                'border-radius:12px;font-size:0.82em">Published</span>'
            )
        return mark_safe(
            '<span style="background:#757575;color:#fff;padding:2px 8px;'
            'border-radius:12px;font-size:0.82em">Draft</span>'
        )

    @admin.display(description="Time Taken")
    def time_taken_display(self, obj):
        if obj.started_at and obj.submitted_at:
            delta = obj.submitted_at - obj.started_at
            minutes = int(delta.total_seconds() // 60)
            seconds = int(delta.total_seconds() % 60)
            return format_html(
                '<span style="color:#1565c0">{:02d}:{:02d}</span>',
                minutes,
                seconds,
            )
        return mark_safe('<span style="color:#9e9e9e">—</span>')

    @admin.display(description="Answers")
    def answers_display(self, obj):
        """Render the JSON answers as a readable table in the detail view."""
        if not obj.answers:
            return mark_safe('<span style="color:#9e9e9e">No answers recorded</span>')
        rows = ""
        for q in obj.quiz.questions.order_by("order"):
            selected = obj.answers.get(str(q.id))
            correct = q.correct_index
            is_correct = selected == correct
            choices = q.choices or []
            selected_text = choices[selected] if selected is not None and selected < len(choices) else "—"
            correct_text  = choices[correct]  if correct < len(choices) else "—"
            row_bg = "#e8f5e9" if is_correct else "#ffebee"
            icon   = "✓" if is_correct else "✗"
            colour = "#388e3c" if is_correct else "#c62828"
            rows += (
                f'<tr style="background:{row_bg}">'
                f'<td style="padding:4px 8px;border:1px solid #ddd">{q.order}. {q.text[:60]}</td>'
                f'<td style="padding:4px 8px;border:1px solid #ddd">{selected_text}</td>'
                f'<td style="padding:4px 8px;border:1px solid #ddd">{correct_text}</td>'
                f'<td style="padding:4px 8px;border:1px solid #ddd;color:{colour};font-weight:700">{icon}</td>'
                f'</tr>'
            )
        table = (
            '<table style="border-collapse:collapse;width:100%;font-size:0.85em">'
            '<thead><tr style="background:#f5f5f5">'
            '<th style="padding:4px 8px;border:1px solid #ddd;text-align:left">Question</th>'
            '<th style="padding:4px 8px;border:1px solid #ddd;text-align:left">Selected</th>'
            '<th style="padding:4px 8px;border:1px solid #ddd;text-align:left">Correct</th>'
            '<th style="padding:4px 8px;border:1px solid #ddd">✓/✗</th>'
            '</tr></thead>'
            f'<tbody>{rows}</tbody>'
            '</table>'
        )
        return mark_safe(table)

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .select_related("student__user", "quiz__course")
        )

    # ── Actions ───────────────────────────────────────────────────────────────

    @admin.action(description="📢 Publish results to students")
    def publish_results(self, request, queryset):
        updated = queryset.update(published=True)
        self.message_user(request, f"{updated} submission(s) published.")

    @admin.action(description="🔒 Unpublish results")
    def unpublish_results(self, request, queryset):
        updated = queryset.update(published=False)
        self.message_user(request, f"{updated} submission(s) unpublished.")

    @admin.action(description="🔄 Recalculate scores from answers")
    def recalculate_scores(self, request, queryset):
        updated = 0
        for sub in queryset.prefetch_related("quiz__questions"):
            sub.score = None   # force recalculation
            sub.grade()
            sub.save(update_fields=["score"])
            updated += 1
        self.message_user(request, f"Recalculated scores for {updated} submission(s).")


# ─────────────────────────────────────────────────────────────────────────────
# Assignment & AssignmentSubmission (registered only if models exist)
# ─────────────────────────────────────────────────────────────────────────────

if HAS_ASSIGNMENTS:

    @admin.register(Assignment)
    class AssignmentAdmin(admin.ModelAdmin):
        list_display = (
            "title",
            "course_display",
            "deadline",           # field is called deadline, not due_date
            "submission_count",   # removed total_marks — no such field on Assignment
        )
        list_filter = (
            ("course", admin.RelatedOnlyFieldListFilter),
            "course__department",
        )
        search_fields = ("title", "description", "course__title")
        date_hierarchy = "deadline"           # was due_date
        list_select_related = ("course",)

        def get_queryset(self, request):
            return (
                super()
                .get_queryset(request)
                .select_related("course")
                .annotate(_sub_count=Count("submissions", distinct=True))
            )

        @admin.display(description="Course")
        def course_display(self, obj):
            return format_html(
                '{}&nbsp;<span style="color:#757575;font-size:0.82em">({})</span>',
                obj.course.title,
                obj.course.get_department_display(),
            )

        @admin.display(description="Submissions", ordering="_sub_count")
        def submission_count(self, obj):
            return format_html(
                '<span style="font-weight:600">{}</span>',
                obj._sub_count,
            )

    @admin.register(AssignmentSubmission)
    class AssignmentSubmissionAdmin(admin.ModelAdmin):
        list_display = (
            "student_display",
            "assignment_display",
            "score_badge",
            "submitted_at",
        )
        list_filter = (
            ("assignment__course", admin.RelatedOnlyFieldListFilter),
            "assignment__course__department",
        )
        search_fields = (
            "student__user__username",
            "assignment__title",
        )
        date_hierarchy = "submitted_at"
        readonly_fields = ("submitted_at",)
        list_select_related = ("student__user", "assignment__course")

        @admin.display(description="Student", ordering="student__user__username")
        def student_display(self, obj):
            name = (
                f"{obj.student.user.first_name} {obj.student.user.last_name}".strip()
                or obj.student.user.username
            )
            return format_html("{}", name)

        @admin.display(description="Assignment")
        def assignment_display(self, obj):
            return format_html(
                '{}&nbsp;<span style="color:#757575;font-size:0.82em">({})</span>',
                obj.assignment.title,
                obj.assignment.course.title,
            )

        @admin.display(description="Score", ordering="score")
        def score_badge(self, obj):
            score = getattr(obj, "score", None)
            if score is None:
                return mark_safe('<span style="color:#9e9e9e">Not graded</span>')
            total = getattr(obj.assignment, "total_marks", 100) or 100
            pct = score / total * 100
            colour = "#388e3c" if pct >= 60 else "#f57c00" if pct >= 40 else "#c62828"
            bg = "#e8f5e9" if pct >= 60 else "#fff3e0" if pct >= 40 else "#ffebee"
            return format_html(
                '<span style="background:{};color:{};padding:2px 10px;'
                'border-radius:12px;font-size:0.82em;font-weight:600">'
                '{:.1f} / {}</span>',
                bg, colour, score, total,
            )

        def get_queryset(self, request):
            return (
                super()
                .get_queryset(request)
                .select_related("student__user", "assignment__course")
            )