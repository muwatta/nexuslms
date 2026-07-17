from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.http import JsonResponse
from django.db import connection


def home(request):
    return JsonResponse({"status": "ok", "service": "nexuslms"})


def healthz(request):
    """Liveness probe: confirms the process is running."""
    return JsonResponse({"status": "ok"})


def readyz(request):
    """Readiness probe: confirms the process can serve traffic (DB reachable)."""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        return JsonResponse({"status": "ok"})
    except Exception as exc:
        return JsonResponse({"status": "error", "detail": str(exc)}, status=503)

urlpatterns = [
    path("", home),
    path("admin/", admin.site.urls),

    # Health probes
    path("healthz", healthz, name="healthz"),
    path("readyz", readyz, name="readyz"),

    # JWT Auth
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # API
    path("api/", include("api.urls")),
]

# serve media in dev
from django.conf import settings
from django.conf.urls.static import static

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

