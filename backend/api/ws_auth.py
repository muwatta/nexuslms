from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.authentication import JWTAuthentication


@database_sync_to_async
def get_jwt_user(token):
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


class CookieJWTAuthMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        scope = dict(scope)
        token = get_cookie(scope.get("headers", []), "access_token")
        scope["user"] = await get_jwt_user(token)
        return await self.app(scope, receive, send)
