from pathlib import Path
import os
from dotenv import load_dotenv
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError(
        "SECRET_KEY environment variable is not set. "
        "Add SECRET_KEY=<value> to your .env file."
    )

DEBUG = os.getenv("DEBUG", "False").lower() in ["true", "1", "yes"]

raw_hosts = os.getenv("ALLOWED_HOSTS", "")
ALLOWED_HOSTS = [h.strip() for h in raw_hosts.split(",") if h.strip()]

if DEBUG:
    ALLOWED_HOSTS = ALLOWED_HOSTS or ["localhost", "127.0.0.1", "0.0.0.0"]

if not DEBUG and not ALLOWED_HOSTS:
    raise ValueError("ALLOWED_HOSTS must be set when DEBUG=False")


INSTALLED_APPS = [
    "daphne",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "django_filters",
    "django_extensions",
    "corsheaders",
    "api",
    "drf_spectacular",
    "channels",
    "rest_framework_simplejwt.token_blacklist",
]


MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "api.middleware.RateLimitMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "api.tenant_middleware.TenantMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "api.middleware.SecurityHeadersMiddleware",
]

ROOT_URLCONF = "nexuslms.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ]
        },
    }
]

WSGI_APPLICATION = "nexuslms.wsgi.application"
ASGI_APPLICATION = "nexuslms.asgi.application"

_redis_url = os.getenv("REDIS_URL", "")
if _redis_url:
    try:
        import channels_redis  # noqa: F401
        CHANNEL_LAYERS = {
            "default": {
                "BACKEND": "channels_redis.core.RedisChannelLayer",
                "CONFIG": {
                    "hosts": [(_redis_url)],
                },
            }
        }
    except ImportError:
        CHANNEL_LAYERS = {
            "default": {
                "BACKEND": "channels.layers.InMemoryChannelLayer"
            }
        }
else:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels.layers.InMemoryChannelLayer"
        }
    }

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL:
    try:
        import dj_database_url
        DATABASES["default"] = dj_database_url.parse(DATABASE_URL, conn_max_age=600)
    except ImportError:
        pass


REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "api.authentication.CookieJWTAuthentication",
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_RENDERER_CLASSES": ("rest_framework.renderers.JSONRenderer",),
    "DEFAULT_PARSER_CLASSES": ("rest_framework.parsers.JSONParser",),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 100,
    "DEFAULT_FILTER_BACKENDS": ["django_filters.rest_framework.DjangoFilterBackend"],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "EXCEPTION_HANDLER": "api.utils.custom_exception_handler",
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "100/day",
        "user": "1000/day",
    },
}


SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME":  timedelta(hours=1),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    # FIX #1 + #7: rotation + blacklisting enabled
    "ROTATE_REFRESH_TOKENS":    True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": False,
    "ALGORITHM":    "HS256",
    "SIGNING_KEY":  SECRET_KEY,
    "VERIFYING_KEY": None,
    "AUDIENCE": None,
    "ISSUER":   None,
    "JWK_URL":  None,
    "LEEWAY":   0,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_HEADER_NAME":  "HTTP_AUTHORIZATION",
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
    "USER_AUTHENTICATION_RULE": "rest_framework_simplejwt.authentication.default_user_authentication_rule",
    "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
    "TOKEN_TYPE_CLAIM": "token_type",
    "TOKEN_USER_CLASS": "rest_framework_simplejwt.models.TokenUser",
    "JTI_CLAIM": "jti",
    # Cookie settings (used by custom views)
    "AUTH_COOKIE":           "access_token",
    "AUTH_COOKIE_DOMAIN":    None,
    "AUTH_COOKIE_SECURE":    False,  # overridden per environment
    "AUTH_COOKIE_HTTP_ONLY": True,
    "AUTH_COOKIE_PATH":      "/",
    "AUTH_COOKIE_SAMESITE":  "Lax",
}
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

SECURE_SSL_REDIRECT            = not DEBUG
SECURE_HSTS_SECONDS            = 31536000 if not DEBUG else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD            = True

SESSION_COOKIE_SECURE   = not DEBUG
CSRF_COOKIE_SECURE      = not DEBUG
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY    = True
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SAMESITE    = "Lax"

X_FRAME_OPTIONS = "DENY"


CORS_ALLOW_ALL_ORIGINS  = False
CORS_ALLOW_CREDENTIALS  = True

_raw_cors = os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173")
CORS_ALLOWED_ORIGINS = [o.strip() for o in _raw_cors.split(",") if o.strip()]

CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]


LANGUAGE_CODE = "en-us"
TIME_ZONE     = "UTC"
USE_I18N      = True
USE_TZ        = True

STATIC_URL   = "static/"
STATIC_ROOT  = BASE_DIR / "staticfiles"      # FIX #12
MEDIA_URL    = "/media/"
MEDIA_ROOT   = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

AUTH_USER_MODEL  = "api.User"


PAYSTACK_SECRET_KEY = os.getenv("PAYSTACK_SECRET_KEY")


EMAIL_BACKEND = os.getenv(
    "EMAIL_BACKEND",
    "django.core.mail.backends.console.EmailBackend",  # dev default
)
EMAIL_HOST          = os.getenv("EMAIL_HOST", "")
EMAIL_PORT          = int(os.getenv("EMAIL_PORT", 587))
EMAIL_USE_TLS       = os.getenv("EMAIL_USE_TLS", "True").lower() in ["true", "1", "yes"]
EMAIL_HOST_USER     = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
DEFAULT_FROM_EMAIL  = os.getenv("DEFAULT_FROM_EMAIL", "noreply@muwata.com")