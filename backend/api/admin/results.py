# backend/api/admin/results.py
# ─────────────────────────────────────────────────────────────────────────────
# Django admin for Result and ReportCard models
# ─────────────────────────────────────────────────────────────────────────────

from django.contrib import admin
from django.utils.html import format_html
from backend.api.core.models import Result, ReportCard


@admin.register(Result)
class ResultAdmin(admin.ModelAdmin):
    list_display = (
        "student_display",
        "course_display",
        "term",
        "academic_year",
        "ca_total_display",
        "exam",
        "total_display",
        "grade_badge",
        "status_badge",
    )
    list_filter  = (
        "status",
        "term",
        "academic_year",
        "student_class",
        "course__department",
    )
    search_fields = (
        "student__user__username",
        "student__user__first_name",
        "student__user__last_name",
        "course__title",
    )
    readonly_fields = (
        "total", "grade", "ca_total",
        "submitted_at", "reviewed_at", "published_at",
        "created_at", "updated_at",
    )
    list_select_related = ("student__user", "course", "entered_by__user")
    ordering = ("-academic_year", "term", "student_class", "course__title")

    fieldsets = (
        ("Academic Identity", {
            "fields": (
                "student", "course", "entered_by",
                "term", "academic_year", "student_class",
            ),
        }),
        ("CA Breakdown", {
            "fields": ("test1", "test2", "assignment", "midterm", "exam"),
            "description": "test1+test2+assignment+midterm = CA (max 40) | exam max 60",
        }),
        ("Computed", {
            "fields": ("total", "grade", "position", "remark"),
        }),
        ("Workflow", {
            "fields": (
                "status",
                "reviewed_by", "published_by",
                "submitted_at", "reviewed_at", "published_at",
            ),
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )

    @admin.display(description="Student")
    def student_display(self, obj):
        name = (
            f"{obj.student.user.first_name} {obj.student.user.last_name}".strip()
            or obj.student.user.username
        )
        return format_html("<strong>{}</strong>", name)

    @admin.display(description="Course")
    def course_display(self, obj):
        return format_html(
            "{} <span style='color:#757575;font-size:0.82em'>({})</span>",
            obj.course.title,
            obj.student_class or "—",
        )

    @admin.display(description="CA")
    def ca_total_display(self, obj):
        return f"{obj.ca_total}/40"

    @admin.display(description="Total", ordering="total")
    def total_display(self, obj):
        color = "#388e3c" if obj.total >= 70 else "#f57c00" if obj.total >= 50 else "#c62828"
        return format_html(
            '<span style="color:{};font-weight:600">{}</span>',
            color, obj.total,
        )

    @admin.display(description="Grade", ordering="grade")
    def grade_badge(self, obj):
        colors = {
            "A": ("#e8f5e9", "#388e3c"),
            "B": ("#e3f2fd", "#1565c0"),
            "C": ("#fff3e0", "#e65100"),
            "D": ("#fce4ec", "#c62828"),
            "E": ("#fce4ec", "#c62828"),
            "F": ("#ffebee", "#b71c1c"),
        }
        bg, fg = colors.get(obj.grade, ("#f5f5f5", "#616161"))
        return format_html(
            '<span style="background:{};color:{};padding:2px 10px;'
            'border-radius:12px;font-weight:600">{}</span>',
            bg, fg, obj.grade or "—",
        )

    @admin.display(description="Status", ordering="status")
    def status_badge(self, obj):
        colors = {
            "draft":     ("#f5f5f5", "#616161"),
            "submitted": ("#fff3e0", "#e65100"),
            "reviewed":  ("#e3f2fd", "#1565c0"),
            "published": ("#e8f5e9", "#388e3c"),
        }
        bg, fg = colors.get(obj.status, ("#f5f5f5", "#616161"))
        return format_html(
            '<span style="background:{};color:{};padding:2px 10px;'
            'border-radius:12px;font-size:0.82em;font-weight:600">{}</span>',
            bg, fg, obj.get_status_display(),
        )

    # ── Bulk actions ──────────────────────────────────────────────────────────

    @admin.action(description="✅ Publish selected results")
    def publish_results(self, request, queryset):
        from django.utils import timezone
        updated = queryset.filter(
            status__in=["submitted", "reviewed"]
        ).update(
            status="published",
            published_at=timezone.now(),
            published_by=request.user,
        )
        self.message_user(request, f"{updated} result(s) published.")

    @admin.action(description="📋 Mark selected as reviewed")
    def mark_reviewed(self, request, queryset):
        from django.utils import timezone
        updated = queryset.filter(status="submitted").update(
            status="reviewed",
            reviewed_at=timezone.now(),
        )
        self.message_user(request, f"{updated} result(s) marked as reviewed.")

    actions = ["publish_results", "mark_reviewed"]

    def ca_total(self, obj):
        return obj.ca_total


@admin.register(ReportCard)
class ReportCardAdmin(admin.ModelAdmin):
    list_display = (
        "student_display",
        "student_class",
        "term",
        "academic_year",
        "total_subjects",
        "average_display",
        "position_display",
        "published_badge",
    )
    list_filter  = (
        "is_published",
        "term",
        "academic_year",
        "student_class",
    )
    search_fields = (
        "student__user__username",
        "student__user__first_name",
        "student__user__last_name",
    )
    readonly_fields = (
        "generated_at", "published_at",
    )
    list_select_related = ("student__user",)

    @admin.display(description="Student")
    def student_display(self, obj):
        name = (
            f"{obj.student.user.first_name} {obj.student.user.last_name}".strip()
            or obj.student.user.username
        )
        return format_html("<strong>{}</strong>", name)

    @admin.display(description="Average", ordering="average_score")
    def average_display(self, obj):
        color = "#388e3c" if obj.average_score >= 70 else "#f57c00" if obj.average_score >= 50 else "#c62828"
        return format_html(
            '<span style="color:{};font-weight:600">{}</span>',
            color, obj.average_score,
        )

    @admin.display(description="Position", ordering="position_in_class")
    def position_display(self, obj):
        if obj.position_in_class:
            return format_html(
                '<strong>{}</strong> / {}',
                obj.position_in_class, obj.class_size,
            )
        return "—"

    @admin.display(description="Published", ordering="is_published")
    def published_badge(self, obj):
        if obj.is_published:
            return format_html(
                '<span style="background:#e8f5e9;color:#388e3c;'
                'padding:2px 10px;border-radius:12px;font-size:0.82em">✅ Published</span>'
            )
        return format_html(
            '<span style="background:#f5f5f5;color:#616161;'
            'padding:2px 10px;border-radius:12px;font-size:0.82em">Draft</span>'
        )

    @admin.action(description="📢 Publish selected report cards")
    def publish_cards(self, request, queryset):
        from django.utils import timezone
        updated = queryset.filter(is_published=False).update(
            is_published=True,
            published_at=timezone.now(),
            published_by=request.user,
        )
        self.message_user(request, f"{updated} report card(s) published.")

    actions = ["publish_cards"]