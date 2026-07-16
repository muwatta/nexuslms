# backend/api/middleware.py
import asyncio
import time
from django.http import JsonResponse, HttpResponse
from django.core.cache import cache
from django.conf import settings


class RateLimitMiddleware:

    RATE_LIMITS_PROD = {
        '/api/auth/login/':                   (5,  300),   
        '/api/auth/refresh/':                 (10,  60),   
        '/api/auth/password-reset-request/':  (3, 3600),   
        '/api/auth/verify-otp/':               (5, 3600),
        '/api/auth/password-reset-confirm/':   (5, 3600),
        '/api/token/':                        (5,  300),  
    }

    RATE_LIMITS_DEV = {
        '/api/auth/login/':                   (100, 300),  
        '/api/auth/refresh/':                 (200,  60),  
        '/api/auth/password-reset-request/':  (20, 3600),
        '/api/auth/verify-otp/':               (50, 3600),
        '/api/auth/password-reset-confirm/':   (50, 3600),
        '/api/token/':                        (100, 300),
    }

    def __init__(self, get_response):
        self.get_response = get_response
        self.limits = self.RATE_LIMITS_DEV if settings.DEBUG else self.RATE_LIMITS_PROD

    def __call__(self, request):
        try:
            rate_limit = self.limits.get(request.path)

            if rate_limit and request.method == 'POST':
                max_requests, time_window = rate_limit
                client_ip  = self._get_client_ip(request)
                cache_key  = f"rate_limit:{request.path}:{client_ip}"

                now      = time.time()
                requests = cache.get(cache_key, [])

                requests = [t for t in requests if now - t < time_window]

                if len(requests) >= max_requests:
                    retry_after = int(time_window - (now - requests[0]))
                    return JsonResponse(
                        {
                            'error': 'Too many requests. Please try again later.',
                            'retry_after_seconds': max(retry_after, 1),
                        },
                        status=429,
                        headers={'Retry-After': str(max(retry_after, 1))},
                    )

                requests.append(now)
                cache.set(cache_key, requests, time_window)

            return self.get_response(request)
        except asyncio.CancelledError:
            return HttpResponse(status=499)

    @staticmethod
    def _get_client_ip(request) -> str:
        forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        if forwarded:
            return forwarded.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', '0.0.0.0')


class SecurityHeadersMiddleware:
    """Add security headers to all responses."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-XSS-Protection']       = '1; mode=block'
        response['Referrer-Policy']        = 'strict-origin-when-cross-origin'
        response['Permissions-Policy']     = (
            'accelerometer=(), camera=(), geolocation=(), gyroscope=(), '
            'magnetometer=(), microphone=(), payment=(), usb=()'
        )
        return response
