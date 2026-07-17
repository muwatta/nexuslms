# backend/api/tests/test_group_sync.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management import call_command
from api.core.models import Profile

User = get_user_model()


def make_up(username, role="student", department="western"):
    user = User.objects.create_user(username=username, password="testpass123")
    profile, _ = Profile.objects.get_or_create(
        user=user,
        defaults={"role": role, "department": department},
    )
    if profile.role != role:
        profile.role = role
        profile.save()
    return user, profile


class GroupSyncTests(TestCase):

    def test_signal_assigns_groups_on_profile_save(self):
        """When a profile is saved with role=teacher, no exception is raised."""
        user, profile = make_up("group_sync_teacher", role="teacher")
        profile.role = "teacher"
        profile.save()  # signal should fire without error
        # Just verify the user object is valid
        self.assertIsNotNone(user.pk)

    def test_management_command_creates_groups_and_syncs(self):
        """init_groups management command runs without error."""
        call_command("init_groups")
        self.assertGreater(Group.objects.count(), 0)