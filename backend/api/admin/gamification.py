from django.contrib import admin
from api.core.models import Achievement, Project, Milestone


@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ("student", "title", "achievement_type", "date_earned")
    search_fields = ("title",)
    list_filter = ("achievement_type", "date_earned")
    date_hierarchy = "date_earned"
    readonly_fields = ("created_at",)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related("student__user")


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("title", "course", "status", "start_date", "end_date")
    search_fields = ("title", "course__title")
    list_filter = ("status", "start_date")
    date_hierarchy = "start_date"
    readonly_fields = ("created_at",)


@admin.register(Milestone)
class MilestoneAdmin(admin.ModelAdmin):
    list_display = ("title", "course", "related_to", "progress_percentage", "created_at")
    search_fields = ("title", "course__title")
    list_filter = ("related_to",)
    date_hierarchy = "created_at"
    readonly_fields = ("created_at",)
