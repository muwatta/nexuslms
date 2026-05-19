from django.contrib import admin
from django.utils.html import format_html, mark_safe
from api.core.models import Course, Enrollment


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "department_display",
        "student_class_display",
        "display_instructor",
        "is_active",
        "created_at",
    )
    list_filter = (
        "department",
        "student_class",
        "is_active",
        ("instructor", admin.RelatedOnlyFieldListFilter),
    )
    search_fields = ("title", "description", "student_class")
    list_editable = ("is_active",)
    list_select_related = ("instructor", "instructor__user")
    date_hierarchy = "created_at"

    fieldsets = (
        (None, {
            "fields": ("title", "description", "is_active"),
        }),
        ("Department & Class", {
            "fields": ("department", "student_class"),
            "classes": ("collapse",),
            "description": "Department determines which students can enroll.",
        }),
        ("Instructor", {
            "fields": ("instructor",),
            "description": "Assign an instructor from the same department.",
        }),
    )

    actions = [
        "activate_courses",
        "deactivate_courses",
        "assign_department_from_instructor",
    ]

    # ── list_display methods ───────────────────────────────────────────────────

    @admin.display(description="Department", ordering="department")
    def department_display(self, obj):
        colour = {
            "western":     "#1976d2",
            "arabic":      "#388e3c",
            "programming": "#7b1fa2",
        }.get(obj.department or "", "#757575")
        label = obj.get_department_display() if obj.department else "—"
        # ✅ Has two {} placeholders → format_html is correct here
        return format_html(
            '<span style="color:{};font-weight:600">{}</span>',
            colour,
            label,
        )

    @admin.display(description="Class")
    def student_class_display(self, obj):
        if obj.student_class:
            # ✅ Has one {} placeholder → format_html is correct here
            return format_html(
                '<span style="background:#e8eaf6;padding:2px 8px;'
                'border-radius:4px;font-size:0.85em">{}</span>',
                obj.student_class,
            )
        # ✅ FIX: fully static string, no {} → must use mark_safe, not format_html
        return mark_safe('<span style="color:#9e9e9e">—</span>')

    @admin.display(description="Instructor", ordering="instructor__user__username")
    def display_instructor(self, obj):
        instr = obj.instructor
        if instr and getattr(instr, "user", None):
            dept = getattr(instr, "department", "") or ""
            # ✅ Has two {} placeholders → format_html is correct here
            return format_html(
                '{}&nbsp;<span style="color:#757575;font-size:0.85em">({})</span>',
                instr.user.username,
                dept,
            )
        # ✅ FIX: fully static string, no {} → must use mark_safe, not format_html
        return mark_safe('<span style="color:#c62828">Not assigned</span>')

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("instructor__user")

    # ── Actions ───────────────────────────────────────────────────────────────

    @admin.action(description="✅ Activate selected courses")
    def activate_courses(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f"{updated} course(s) activated.")

    @admin.action(description="🚫 Deactivate selected courses")
    def deactivate_courses(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f"{updated} course(s) deactivated.")

    @admin.action(description="🔄 Set department from instructor's department")
    def assign_department_from_instructor(self, request, queryset):
        updated = 0
        for course in queryset.select_related("instructor"):
            if course.instructor and course.instructor.department:
                course.department = course.instructor.department
                course.save(update_fields=["department"])
                updated += 1
        self.message_user(request, f"Updated {updated} course(s).")


# ─────────────────────────────────────────────────────────────────────────────

@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = (
        "student_display",
        "course_display",
        "academic_year",
        "status_badge",
        "enrolled_at",
    )
    list_filter = (
        "status",
        "academic_year",
        ("course", admin.RelatedOnlyFieldListFilter),
    )
    search_fields = (
        "student__user__username",
        "course__title",
        "student__student_id",
    )
    date_hierarchy = "enrolled_at"
    readonly_fields = ("enrolled_at", "promoted_at")
    list_select_related = ("student__user", "course")

    fieldsets = (
        (None, {
            "fields": ("student", "course", "academic_year", "status"),
        }),
        ("Dates", {
            "fields": ("enrolled_at", "completed_at"),
            "classes": ("collapse",),
        }),
        ("Promotion", {
            "fields": ("promoted_from", "promoted_at", "promoted_by"),
            "classes": ("collapse",),
        }),
    )

    @admin.display(description="Student", ordering="student__user__username")
    def student_display(self, obj):
        sid = obj.student.student_id or ""
        # ✅ Has two {} placeholders → format_html is correct here
        return format_html(
            '{}&nbsp;<span style="color:#757575;font-size:0.85em">{}</span>',
            obj.student.user.username,
            sid,
        )

    @admin.display(description="Course")
    def course_display(self, obj):
        # ✅ Has two {} placeholders → format_html is correct here
        return format_html(
            '{}&nbsp;<span style="color:#757575;font-size:0.85em">({})</span>',
            obj.course.title,
            obj.course.get_department_display(),
        )

    @admin.display(description="Status")
    def status_badge(self, obj):
        colours = {
            "pending":   "#f57c00",
            "active":    "#388e3c",
            "completed": "#1565c0",
            "dropped":   "#c62828",
            "promoted":  "#6a1b9a",
        }
        bg = colours.get(obj.status, "#757575")
        # ✅ Has two {} placeholders → format_html is correct here
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 10px;'
            'border-radius:12px;font-size:0.82em">{}</span>',
            bg,
            obj.get_status_display(),
        )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("student__user", "course")