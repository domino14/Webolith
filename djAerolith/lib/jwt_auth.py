import json
import logging

import jwt
from jwt.exceptions import InvalidTokenError, ExpiredSignatureError

from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.http import JsonResponse

logger = logging.getLogger(__name__)


def jwt_or_login_required(view_func):
    """
    Decorator that accepts either:
      - A valid JWT Bearer token in the Authorization header (mobile clients), OR
      - An active Django session (existing web clients, falls through to @login_required).

    On a valid Bearer token the User is resolved from the 'sub' claim and
    attached to request.user before the view is called.

    Returns 401 JSON on an invalid or expired bearer token so mobile clients
    get a machine-readable error rather than a redirect to the login page.
    """

    def _wrapped(request, *args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[len("Bearer "):]
            try:
                payload = jwt.decode(
                    token, settings.SECRET_KEY, algorithms=["HS256"]
                )
                user = User.objects.get(pk=int(payload["sub"]))
                request.user = user
                return view_func(request, *args, **kwargs)
            except ExpiredSignatureError:
                return JsonResponse({"error": "Token expired."}, status=401)
            except (InvalidTokenError, User.DoesNotExist, KeyError, ValueError):
                return JsonResponse({"error": "Invalid token."}, status=401)

        # No Bearer header — fall back to session auth via @login_required.
        return login_required(view_func)(request, *args, **kwargs)

    _wrapped.__name__ = view_func.__name__
    _wrapped.__module__ = view_func.__module__
    return _wrapped
