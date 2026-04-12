from .base import *

DEBUG = False

# CRITICAL: Use your production domain(s) here or via environment.
ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv(
        "ALLOWED_HOSTS",
        "yourdomain.com,www.yourdomain.com",
    ).split(",")
    if host.strip()
]



# Force HTTPS
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# HTTP Strict Transport Security (HSTS)
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Secure cookies (HTTPS only)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# SimpleJWT cookie settings for production
SIMPLE_JWT['AUTH_COOKIE_SECURE'] = True

# Additional security headers
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True


CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ALLOWED_ORIGINS",
        "https://yourdomain.com,https://app.yourdomain.com",
    ).split(",")
    if origin.strip()
]



EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
# Configure these in your .env file:
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USE_TLS=True
# EMAIL_HOST_USER=your-email@domain.com
# EMAIL_HOST_PASSWORD=your-app-password
# DEFAULT_FROM_EMAIL=noreply@muwata.com


LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'WARNING',
            'class': 'logging.FileHandler',
            'filename': '/var/log/nexuslms/django.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'WARNING',
            'propagate': True,
        },
    },
}