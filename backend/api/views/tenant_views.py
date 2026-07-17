# backend/api/views/tenant_views.py
from datetime import timedelta

from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.core.models import School, Subscription, User, Profile
from api.serializers.tenant import (
    SchoolSerializer,
    SchoolRegistrationSerializer,
    SubscriptionSerializer,
    SubscriptionInitSerializer,
)
from api.permissions import IsSuperAdmin


class SchoolViewSet(viewsets.ModelViewSet):
    """CRUD for schools. Only super_admin can manage all schools."""
    queryset = School.objects.all()
    serializer_class = SchoolSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsSuperAdmin()]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, "role", None) == "super_admin":
            return School.objects.all()
        school = getattr(user, "school", None)
        if school:
            return School.objects.filter(pk=school.pk)
        return School.objects.none()


class SubscriptionViewSet(viewsets.ModelViewSet):
    """Manage subscriptions for a school."""
    queryset = Subscription.objects.all()
    serializer_class = SubscriptionSerializer

    def get_permissions(self):
        return [IsAuthenticated(), IsSuperAdmin()]

    def get_queryset(self):
        user = self.request.user
        school = getattr(user, "school", None)
        if getattr(user, "role", None) == "super_admin":
            return Subscription.objects.all()
        if school:
            return Subscription.objects.filter(school=school)
        return Subscription.objects.none()


class SchoolRegistrationView(APIView):
    """
    Public endpoint: register a new school + admin user.
    Creates the school on the free trial plan.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SchoolRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Create school
        school = School.objects.create(
            name=data["name"],
            slug=data["slug"],
            code=data["slug"][:10].upper(),
            owner_email=data["owner_email"],
            owner_phone=data.get("owner_phone", ""),
            plan="free",
            trial_ends_at=timezone.now() + timedelta(days=14),
            max_students=50,
            max_teachers=10,
            max_courses=30,
        )

        # Create admin user
        user = User.objects.create_user(
            username=data["username"],
            email=data["owner_email"],
            password=data["password"],
            first_name=data["first_name"],
            last_name=data["last_name"],
            role="admin",
            school=school,
        )

        # Create admin profile
        Profile.objects.create(
            user=user,
            role="admin",
            school=school,
        )

        return Response(
            {
                "school": SchoolSerializer(school).data,
                "user": {"id": user.id, "username": user.username, "role": user.role},
            },
            status=status.HTTP_201_CREATED,
        )


class SubscriptionInitializeView(APIView):
    """
    Initialize a Paystack subscription for the current school.
    Returns the authorization URL for the user to complete payment.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        school = getattr(user, "school", None)
        if not school:
            return Response({"detail": "No school associated with this account."}, status=400)

        if getattr(user, "role", None) not in ("admin", "super_admin"):
            return Response({"detail": "Only school admins can manage subscriptions."}, status=403)

        serializer = SubscriptionInitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        plan = serializer.validated_data["plan"]

        plan_amounts = {
            "starter": 15000,
            "pro": 35000,
            "enterprise": 80000,
        }
        amount = plan_amounts.get(plan, 15000)

        try:
            from api.paystack_client import initialize_transaction
            result = initialize_transaction(
                amount=amount,
                email=school.owner_email or user.email,
                callback_url=serializer.validated_data.get("callback_url", ""),
            )
            return Response({
                "authorization_url": result.get("data", {}).get("authorization_url", ""),
                "reference": result.get("data", {}).get("reference", ""),
                "plan": plan,
                "amount": amount,
            })
        except Exception as e:
            return Response(
                {"detail": f"Payment initialization failed: {str(e)}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )


class SubscriptionVerifyView(APIView):
    """
    Verify a Paystack subscription payment and activate the plan.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        reference = request.data.get("reference")
        if not reference:
            return Response({"detail": "Payment reference required."}, status=400)

        try:
            from api.paystack_client import verify_transaction
            result = verify_transaction(reference)
            data = result.get("data", {})

            if data.get("status") != "success":
                return Response({"detail": "Payment not successful."}, status=400)

            user = request.user
            school = getattr(user, "school", None)
            if not school:
                return Response({"detail": "No school associated."}, status=400)

            amount_paid = data.get("amount", 0) / 100  # kobo to naira

            # Determine plan from amount
            plan_map = {15000: "starter", 35000: "pro", 80000: "enterprise"}
            plan = plan_map.get(amount_paid, "starter")

            plan_limits = {
                "starter":    {"students": 200, "teachers": 30, "courses": 100},
                "pro":        {"students": 500, "teachers": 80, "courses": 300},
                "enterprise": {"students": 5000, "teachers": 500, "courses": 2000},
            }
            limits = plan_limits.get(plan, plan_limits["starter"])

            # Update school
            school.plan = plan
            school.subscribed_at = timezone.now()
            school.expires_at = timezone.now() + timedelta(days=30)
            school.max_students = limits["students"]
            school.max_teachers = limits["teachers"]
            school.max_courses = limits["courses"]
            school.save()

            # Create subscription record
            subscription = Subscription.objects.create(
                school=school,
                plan=plan,
                status="active",
                amount=amount_paid,
                start_date=timezone.now(),
                next_billing_date=timezone.now() + timedelta(days=30),
            )

            return Response({
                "detail": "Subscription activated successfully.",
                "school": SchoolSerializer(school).data,
                "subscription": SubscriptionSerializer(subscription).data,
            })

        except Exception as e:
            return Response(
                {"detail": f"Verification failed: {str(e)}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )
