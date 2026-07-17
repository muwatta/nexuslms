# backend/api/middleware.py — tenant isolation
from django.http import JsonResponse


class TenantMiddleware:
    """
    Resolves the current school/tenant from the authenticated user
    and attaches it to the request for downstream use.

    The school is available as `request.school` throughout the request lifecycle.
    super_admin users have request.school = None (full cross-tenant access).
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.school = None

        if hasattr(request, "user") and request.user.is_authenticated:
            try:
                profile = request.user.profile
                request.school = getattr(profile, "school", None)
            except Exception:
                request.school = getattr(request.user, "school", None)

        response = self.get_response(request)
        return response
