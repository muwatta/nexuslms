# backend/api/views/user_views.py (create this file if it doesn't exist)
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from ..serializers.user_serializers import UserRegistrationSerializer
from ..core.models import User

class RegisterView(generics.CreateAPIView):
    """
    Handle user registration
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom token obtain pair view
    """
    pass

class CustomTokenRefreshView(TokenRefreshView):
    """
    Custom token refresh view
    """
    pass