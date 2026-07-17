from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.authentication import JWTAuthentication
import logging

logger = logging.getLogger(__name__)


@database_sync_to_async
def get_jwt_user(token):
    if not token:
        return AnonymousUser()
    try:
        authenticator = JWTAuthentication()
        return authenticator.get_user(authenticator.get_validated_token(token))
    except Exception:
        return AnonymousUser()


def get_cookie(headers, name):
    for key, value in headers:
        if key != b"cookie":
            continue
        for item in value.decode().split(";"):
            key, _, value = item.strip().partition("=")
            if key == name:
                return value
    return ""


def get_token_from_query(scope):
    qs = parse_qs(scope.get("query_string", b"").decode())
    tokens = qs.get("token", [])
    return tokens[0] if tokens else ""


class CookieJWTAuthMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        scope = dict(scope)
        token = get_cookie(scope.get("headers", []), "access_token")
        if not token:
            token = get_token_from_query(scope)
        if not token:
            logger.debug("No token found in cookie or query string")
        scope["user"] = await get_jwt_user(token)
        return await self.app(scope, receive, send)
