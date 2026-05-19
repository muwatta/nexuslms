import secrets
import string
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.utils.html import format_html
from api.core.models import Profile
from api.signals import sync_role_to_groups

User = get_user_model()

try:
    admin.site.unregister(Group)
except admin.sites.NotRegistered:
    pass


class CustomGroupAdmin(admin.ModelAdmin):
    list_display = ("name", "user_count")
    search_fields = ("name",)

    def user_count(self, obj):
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            return User.objects.filter(groups=obj).count()
        except Exception:
            return 0
    user_count.short_description = "User Count"

    def get_queryset(self, request):
        return super().get_queryset(request)

    class UserInline(admin.TabularInline):
        model = User.groups.through
        verbose_name = "User"
        verbose_name_plural = "Users in Group"
        extra = 0
        autocomplete_fields = ["user"]

    inlines = [UserInline]


admin.site.register(Group, CustomGroupAdmin)


class ProfileInline(admin.StackedInline):
    model = Profile
    fk_name = "user"
    can_delete = False
    verbose_name_plural = "Profile Details"
    fields = (
        "role",
        "teacher_type",
        "department",
        "student_class",
        "stream",
        "student_id",
        "phone",
        "parent_email",
        "bio",
    )

    def get_fields(self, request, obj=None):
        fields = list(super().get_fields(request, obj))
        if not request.user.is_superuser and "parent_email" in fields:
            fields.remove("parent_email")
        return fields


@admin.register(User)
class CustomUserAdmin(BaseUserAdmin):
    list_display = (
        "username",
        "email",
        "first_name",
        "last_name",
        "get_role",
        "get_instructor_type",
        "get_department",
        "get_student_id",
        "is_staff",
        "is_active",
        "date_joined",
        "get_groups",
    )
    list_filter = (
        "is_staff",
        "is_active",
        "profile__role",
        "profile__teacher_type",
        "profile__department",
        "groups__name",
    )
    search_fields = (
        "username",
        "email",
        "first_name",
        "last_name",
        "profile__phone",
    )
    inlines = [ProfileInline]
    actions = ["sync_groups_from_role"]

    change_list_template = "admin/user_change_list.html"

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        qs = self.get_queryset(request)
        extra_context["user_count"] = qs.count()
        return super().changelist_view(request, extra_context=extra_context)

    @admin.action(description="Sync groups from profile role")
    def sync_groups_from_role(self, request, queryset):
        for user in queryset:
            try:
                profile = user.profile
            except Profile.DoesNotExist:
                continue
            sync_role_to_groups(Profile, profile, False)
        self.message_user(request, "Groups synchronized for selected users.")

    def get_queryset(self, request):
        qs = (
            super()
            .get_queryset(request)
            .select_related("profile")
            .prefetch_related("groups")
        )
        if request.user.is_superuser:
            return qs
        try:
            prof = request.user.profile
        except Profile.DoesNotExist:
            return qs.none()
        role = prof.role
        if role in ["admin", "teacher"]:
            return qs.filter(profile__department=prof.department)
        if role in ["parent", "student"]:
            return qs.filter(id=request.user.id)
        return qs.none()

    def get_inline_instances(self, request, obj=None):
        if obj is None:
            return []
        return super().get_inline_instances(request, obj)

    def get_urls(self):
        from django.urls import path
        urls = super().get_urls()
        custom_urls = [
            path(
                "import-excel/",
                self.admin_site.admin_view(self.import_excel),
                name="user_import_excel",
            ),
        ]
        return custom_urls + urls

    def import_excel(self, request):
        from django import forms
        import openpyxl
        from django.shortcuts import render, redirect

        class UploadForm(forms.Form):
            file = forms.FileField()

        if request.method == "POST":
            form = UploadForm(request.POST, request.FILES)
            if form.is_valid():
                wb = openpyxl.load_workbook(form.cleaned_data["file"])
                sheet = wb.active
                for row in sheet.iter_rows(min_row=2, values_only=True):
                    username, email, first_name, last_name, role, dept, student_cls = (
                        row[:7]
                    )
                    if not username:
                        continue
                    user, created = User.objects.get_or_create(
                        username=username,
                        defaults={
                            "email": email or "",
                            "first_name": first_name or "",
                            "last_name": last_name or "",
                        },
                    )
                    if created:
                        user.set_password(''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12)))
                        user.save()
                    profile, _ = Profile.objects.get_or_create(user=user)
                    if role:
                        profile.role = role
                    if dept:
                        profile.department = dept
                    if student_cls:
                        profile.student_class = student_cls
                    profile.save()
                self.message_user(request, "Users imported from Excel.")
                return redirect("..")
        else:
            form = UploadForm()

        context = {"form": form, "title": "Import users from Excel"}
        return render(request, "admin/import_excel.html", context)

    @admin.display(description="Role", ordering="profile__role")
    def get_role(self, obj):
        try:
            return obj.profile.get_role_display()
        except Profile.DoesNotExist:
            return "—"

    @admin.display(description="Student ID", ordering="profile__student_id")
    def get_student_id(self, obj):
        try:
            return obj.profile.student_id or "—"
        except Profile.DoesNotExist:
            return "—"

    @admin.display(description="Teacher Type", ordering="profile__teacher_type")
    def get_instructor_type(self, obj):
        try:
            profile = obj.profile
            if profile.role == "teacher" and profile.teacher_type:
                mapping = {"class": "Class Teacher", "subject": "Subject Teacher"}
                return mapping.get(profile.teacher_type, profile.teacher_type.title())
            return "—"
        except Profile.DoesNotExist:
            return "—"

    @admin.display(description="Department", ordering="profile__department")
    def get_department(self, obj):
        try:
            return obj.profile.get_department_display() or "—"
        except Profile.DoesNotExist:
            return "—"

    @admin.display(description="Groups")
    def get_groups(self, obj):
        groups = obj.groups.all()
        if not groups:
            return "—"
        return format_html(
            "{}",
            ", ".join(g.name for g in groups),
        )