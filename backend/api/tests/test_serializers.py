# backend/api/tests/test_serializers.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from api.core.models import Profile

User = get_user_model()


class SerializerTests(TestCase):

    def test_profile_serializer(self):
        """Profile serializer returns expected fields."""
        from api.serializers import ProfileSerializer
        user = User.objects.create_user(username="ser_test_user", password="testpass123")
        profile, _ = Profile.objects.get_or_create(
            user=user,
            defaults={"role": "student", "department": "western"},
        )
        data = ProfileSerializer(profile).data
        self.assertIn("role", data)
        self.assertIn("department", data)
        self.assertEqual(data["role"], "student")