from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

class User(AbstractUser):
   
    
    ROLE_CHOICES = (
        ("student",       _("Student")),
        ("teacher",       _("Teacher")),
        ("instructor",    _("Instructor")),
        ("admin",         _("Admin")),
        ("parent",        _("Parent")),
        ("school_admin",  _("School Admin")),
        ("super_admin",   _("Super Admin")),
    )

    role = models.CharField(
        _("role"),
        max_length=20,
        choices=ROLE_CHOICES,
        default="student",
        help_text=_("Primary role of the user — determines permissions and UI access."),
    )

    groups = models.ManyToManyField(
        Group,
        related_name="custom_users",          
        blank=True,
        verbose_name=_("groups"),
        help_text=_("The groups this user belongs to. A user will get all permissions "
                    "granted to each of their groups."),
    )

    user_permissions = models.ManyToManyField(
        Permission,
        related_name="custom_user_permissions",
        blank=True,
        verbose_name=_("user permissions"),
        help_text=_("Specific permissions for this user."),
    )

    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    updated_at = models.DateTimeField(_("updated at"), auto_now=True)
    class Meta:
        verbose_name = _("user")
        verbose_name_plural = _("users")
        ordering = ["username"]

    def __str__(self):
        full_name = self.get_full_name().strip()
        if full_name:
            return f"{full_name} ({self.role})"
        return f"{self.username} ({self.role})"

    @property
    def is_student(self) -> bool:
        return self.role == "student"

    @property
    def is_teacher(self) -> bool:
        return self.role in ("teacher", "instructor")

    @property
    def is_admin(self) -> bool:
        return self.role in ("admin", "school_admin", "super_admin")

    @property
    def is_parent(self) -> bool:
        return self.role == "parent"

    @property
    def is_staff_or_admin(self) -> bool:
        return self.is_staff or self.is_admin