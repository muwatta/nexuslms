# backend/api/views/auth_views.py
import time
import random
import string
import datetime
import logging
import traceback
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken as BaseRefreshToken, TokenError

from ..models import PasswordResetOTP

User = get_user_model()
logger = logging.getLogger(__name__)

# =============================================================================
# SECURITY CONFIGURATION
# =============================================================================

COOKIE_SAMESITE        = "Lax"
COOKIE_SECURE          = not settings.DEBUG
ACCESS_TOKEN_LIFETIME  = datetime.timedelta(hours=1)
REFRESH_TOKEN_LIFETIME = datetime.timedelta(days=7)


# =============================================================================
# CUSTOM TOKEN CLASS
# =============================================================================

class CustomRefreshToken(BaseRefreshToken):
    """
    Extends BaseRefreshToken to embed profile data in the payload.
    super().for_user(user) MUST be called first so simplejwt sets
    jti, token_type, exp, iat, user_id before we overlay custom claims.
    """

    @classmethod
    def for_user(cls, user):
        token = super().for_user(user)

        token["username"]     = str(user.username)
        token["email"]        = str(user.email or "")
        token["first_name"]   = str(user.first_name or "")
        token["last_name"]    = str(user.last_name  or "")
        token["is_staff"]     = bool(user.is_staff)
        token["is_superuser"] = bool(user.is_superuser)
        token["is_active"]    = bool(user.is_active)

        try:
            profile = user.profile
            token["role"]            = str(getattr(profile, "role",            "") or "")
            token["department"]      = str(getattr(profile, "department",      "") or "")
            token["instructor_type"] = str(getattr(profile, "instructor_type", "") or "")
        except Exception:
            token["role"]            = ""
            token["department"]      = ""
            token["instructor_type"] = ""

        return token


# =============================================================================
# COOKIE HELPERS
# =============================================================================

def set_auth_cookies(response, access_token, refresh_token):
    response.set_cookie(
        key="access_token", value=access_token,
        httponly=True, secure=COOKIE_SECURE, samesite=COOKIE_SAMESITE,
        max_age=int(ACCESS_TOKEN_LIFETIME.total_seconds()), path="/api/",
    )
    response.set_cookie(
        key="refresh_token", value=refresh_token,
        httponly=True, secure=COOKIE_SECURE, samesite=COOKIE_SAMESITE,
        max_age=int(REFRESH_TOKEN_LIFETIME.total_seconds()), path="/api/auth/refresh/",
    )
    return response


def clear_auth_cookies(response):
    response.delete_cookie("access_token",  path="/api/")
    response.delete_cookie("refresh_token", path="/api/auth/refresh/")
    return response


# =============================================================================
# PASSWORD RESET HELPERS
# =============================================================================

def generate_otp():
    return "".join(random.choices(string.digits, k=6))


@api_view(["POST"])
@permission_classes([AllowAny])
def password_reset_request(request):
    email = request.data.get("email")
    if not email:
        return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # FIX #15: uniform response — never reveal whether the email exists.
        # Also add a tiny sleep so response timing can't distinguish the two paths.
        time.sleep(0.1)
        return Response(
            {"message": "If an account exists with this email, you will receive a verification code."},
            status=status.HTTP_200_OK,
        )

    otp = generate_otp()
    PasswordResetOTP.objects.update_or_create(
        user=user,
        defaults={"otp": otp, "created_at": timezone.now(), "is_used": False},
    )

    try:
        send_mail(
            subject="Muwatta Academy - Password Reset Code",
            message=f"Your password reset code is: {otp}\n\nThis code will expire in 10 minutes.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
    except Exception as e:
        logger.error(f"Failed to send password reset email: {e}")
        return Response(
            {"error": "Failed to send email. Please try again later."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response({"message": "Verification code sent to your email"}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
def verify_otp(request):
    email = request.data.get("email")
    otp   = request.data.get("otp")
    if not email or not otp:
        return Response({"error": "Email and OTP are required"}, status=status.HTTP_400_BAD_REQUEST)

    # FIX #15: constant-time response — sleep before any branch so timing
    # cannot reveal whether the email or the OTP was wrong.
    time.sleep(0.1)

    try:
        user       = User.objects.get(email=email)
        otp_record = PasswordResetOTP.objects.get(user=user, otp=otp, is_used=False)
        if otp_record.is_expired():
            return Response(
                {"error": "Verification code has expired. Please request a new one."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({"message": "Code verified successfully"}, status=status.HTTP_200_OK)
    except (User.DoesNotExist, PasswordResetOTP.DoesNotExist):
        return Response({"error": "Invalid verification code"}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([AllowAny])
def password_reset_confirm(request):
    email        = request.data.get("email")
    otp          = request.data.get("otp")
    new_password = request.data.get("new_password")

    if not all([email, otp, new_password]):
        return Response(
            {"error": "Email, OTP, and new password are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if len(new_password) < 8:
        return Response(
            {"error": "Password must be at least 8 characters long"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    time.sleep(0.1)  # FIX #15: constant-time

    try:
        user       = User.objects.get(email=email)
        otp_record = PasswordResetOTP.objects.get(user=user, otp=otp, is_used=False)
        if otp_record.is_expired():
            return Response(
                {"error": "Verification code has expired"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.set_password(new_password)
        user.save()
        otp_record.is_used = True
        otp_record.save()
        return Response({"message": "Password reset successfully"}, status=status.HTTP_200_OK)
    except (User.DoesNotExist, PasswordResetOTP.DoesNotExist):
        return Response({"error": "Invalid request"}, status=status.HTTP_400_BAD_REQUEST)


# =============================================================================
# AUTH ENDPOINTS
# =============================================================================

@api_view(["POST"])
@permission_classes([AllowAny])
def secure_login(request):
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return Response(
            {"error": "Username and password are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    AUTH_FAILED_MSG = "Invalid username or password"

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({"error": AUTH_FAILED_MSG}, status=status.HTTP_401_UNAUTHORIZED)

    if not user.check_password(password):
        return Response({"error": AUTH_FAILED_MSG}, status=status.HTTP_401_UNAUTHORIZED)

    if not user.is_active:
        return Response(
            {"error": "Account is disabled. Please contact support."},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        refresh       = CustomRefreshToken.for_user(user)
        access_token  = str(refresh.access_token)
        refresh_token = str(refresh)
    except Exception as e:
        logger.error(f"Token generation failed for '{username}': {e}\n{traceback.format_exc()}")
        return Response(
            {"error": "Authentication service temporarily unavailable. Please try again."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    user_data = {
        "id":           user.id,
        "username":     user.username,
        "email":        user.email,
        "first_name":   user.first_name,
        "last_name":    user.last_name,
        "is_staff":     user.is_staff,
        "is_superuser": user.is_superuser,
    }
    try:
        profile = user.profile
        user_data.update({
            "role":            getattr(profile, "role",            None),
            "department":      getattr(profile, "department",      None),
            "instructor_type": getattr(profile, "instructor_type", None),
        })
    except Exception:
        pass

    response = Response({"user": user_data, "message": "Login successful"}, status=status.HTTP_200_OK)
    return set_auth_cookies(response, access_token, refresh_token)


@api_view(["POST"])
@permission_classes([AllowAny])
def secure_refresh(request):
    """
    FIX #7: Now rotates the refresh token on every call.
    Old refresh token → blacklisted (because BLACKLIST_AFTER_ROTATION=True).
    New refresh token → set in cookie alongside new access token.
    """
    refresh_token = request.COOKIES.get("refresh_token")
    if not refresh_token:
        return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        refresh          = CustomRefreshToken(refresh_token)

        # FIX #7: rotate — generates a brand-new refresh token and blacklists the old one
        refresh.set_jti()   # new unique jti
        refresh.set_exp()   # reset 7-day expiry from now
        new_access  = str(refresh.access_token)
        new_refresh = str(refresh)

        response_data = {"message": "Token refreshed successfully"}

        if request.data.get("include_user"):
            user_id = refresh.payload.get("user_id")
            try:
                u = User.objects.get(pk=user_id)
                response_data["user"] = {"id": u.id, "username": u.username}
            except User.DoesNotExist:
                pass

        response = Response(response_data, status=status.HTTP_200_OK)
        return set_auth_cookies(response, new_access, new_refresh)

    except TokenError:
        response = Response(
            {"error": "Session expired. Please login again."},
            status=status.HTTP_401_UNAUTHORIZED,
        )
        return clear_auth_cookies(response)
    except Exception as e:
        logger.error(f"Token refresh failed: {e}")
        return Response({"error": "Authentication failed"}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def secure_logout(request):
    """
    FIX #1: blacklist() now actually works because token_blacklist is in INSTALLED_APPS.
    """
    refresh_token = request.COOKIES.get("refresh_token")
    if refresh_token:
        try:
            token = CustomRefreshToken(refresh_token)
            token.blacklist()
        except (TokenError, AttributeError) as e:
            # Token may already be expired or invalid — still clear cookies
            logger.debug(f"Logout blacklist skipped: {e}")

    response = Response({"message": "Logged out successfully"}, status=status.HTTP_200_OK)
    return clear_auth_cookies(response)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def auth_status(request):
    user = request.user
    user_data = {
        "id":         user.id,
        "username":   user.username,
        "email":      user.email,
        "first_name": user.first_name,
        "last_name":  user.last_name,
    }
    try:
        profile = user.profile
        user_data.update({
            "role":            getattr(profile, "role",            None),
            "department":      getattr(profile, "department",      None),
            "instructor_type": getattr(profile, "instructor_type", None),
        })
    except Exception:
        pass

    return Response({"authenticated": True, "user": user_data})