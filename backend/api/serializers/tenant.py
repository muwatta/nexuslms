# backend/api/serializers/tenant.py
from rest_framework import serializers
from api.core.models import School, Subscription


class SchoolSerializer(serializers.ModelSerializer):
    is_subscription_active = serializers.BooleanField(read_only=True)
    can_add_student = serializers.BooleanField(read_only=True)
    can_add_teacher = serializers.BooleanField(read_only=True)
    can_add_course = serializers.BooleanField(read_only=True)

    class Meta:
        model = School
        fields = [
            "id", "name", "code", "slug", "is_active",
            "owner_email", "owner_phone", "website",
            "plan", "trial_ends_at", "subscription_id",
            "max_students", "max_teachers", "max_courses",
            "allow_western", "allow_arabic", "allow_programming",
            "subscribed_at", "expires_at",
            "is_subscription_active", "can_add_student", "can_add_teacher", "can_add_course",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class SchoolRegistrationSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    slug = serializers.SlugField(max_length=50)
    owner_email = serializers.EmailField()
    owner_phone = serializers.CharField(max_length=20, required=False, default="")
    first_name = serializers.CharField(max_length=30)
    last_name = serializers.CharField(max_length=30)
    username = serializers.CharField(max_length=30)
    password = serializers.CharField(min_length=8, write_only=True)

    def validate_slug(self, value):
        if School.objects.filter(slug=value).exists():
            raise serializers.ValidationError("This slug is already taken.")
        return value

    def validate_username(self, value):
        from api.core.models import User
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value


class SubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        fields = [
            "id", "school", "plan", "status",
            "paystack_customer_code", "paystack_subscription_code", "paystack_plan_code",
            "amount", "currency",
            "start_date", "next_billing_date", "cancelled_at",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class SubscriptionInitSerializer(serializers.Serializer):
    plan = serializers.ChoiceField(choices=["starter", "pro", "enterprise"])
    callback_url = serializers.URLField(required=False, default="")
