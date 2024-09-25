# Aerolith 2.0: A web-based word game website
# Copyright (C) 2011 Cesar Del Solar
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

# To contact the author, please email delsolar at gmail dot com

import logging
import json
import time
from urllib.parse import urlencode

from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.core.mail import send_mail
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse, HttpResponseRedirect, HttpResponseBadRequest
import jwt
from jwt.exceptions import InvalidTokenError, ExpiredSignatureError

from lib.response import response, StatusCode

logger = logging.getLogger(__name__)
ACCESS_TOKEN_EXPIRATION = 3600 * 6


def health(request):
    # HAProxy health request
    if request.method != "OPTIONS":
        return response("Bad method.", StatusCode.BAD_REQUEST)
    return response("OK")


def trigger500(request):
    logger.info("Triggering 500 for request user: %s", request.user)
    raise Exception("OH NO")


def login_error(request):
    return render(request, "login_error.html")


def new_social_user(request):
    return render(request, "new_social_user.html")


@login_required
def js_error(request):
    err = json.loads(request.body)

    if not settings.DEBUG:
        send_mail(
            "User {0} encountered JS error: {1}".format(
                request.user, err["fe_message"]
            ),
            json.dumps(err, indent=2),
            "root@aerolith",
            [admin[1] for admin in settings.ADMINS],
        )
    else:
        # Send a "fake" email - just log.
        logger.debug("Fake email:")
        logger.debug(
            "Subject: User %s encountered JS error: %s", request.user, err["fe_message"]
        )
        logger.debug("Body: %s", json.dumps(err, indent=2))
        logger.debug("From: root@aerolith")
        logger.debug("To: %s", [admin[1] for admin in settings.ADMINS])

    return response("OK")


@login_required
def test_500(request):
    raise Exception("A test 500")


@csrf_exempt
def healthz(request):
    if request.method == "OPTIONS":
        return response("OK")
    if request.method == "GET":
        return response("OK")
    elif request.method == "POST":
        return response("OKPOST")
    return response("Bad method.", StatusCode.BAD_REQUEST)


@login_required
def jwt_req(request):
    access_token = jwt.encode(
        {
            "iss": "aerolith.org",
            "sub": request.user.pk,
            "usn": request.user.username,
            "exp": int(time.time()) + ACCESS_TOKEN_EXPIRATION,
        },
        settings.SECRET_KEY,
        algorithm="HS256",
    )

    # Check for a 'callback' parameter in the request
    callback_url = request.GET.get("callback")

    if callback_url:
        # Append the token as a query parameter to the callback URL
        query_params = urlencode({"token": access_token})
        redirect_url = f"{callback_url}?{query_params}"
        return HttpResponseRedirect(redirect_url)

    # If no callback, return the token in a JSON response
    return JsonResponse(
        {
            "token": access_token,
        }
    )


def jwt_extend(request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return HttpResponseBadRequest("Authorization header missing or malformed")

    token = auth_header.split("Bearer ")[1]

    try:
        # Decode and verify the JWT
        decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])

        # Re-issue a new JWT with the same claims
        access_token = jwt.encode(
            {
                "iss": decoded_token["iss"],
                "sub": decoded_token["sub"],
                "usn": decoded_token["usn"],
                "exp": int(time.time()) + ACCESS_TOKEN_EXPIRATION,
            },
            settings.SECRET_KEY,
            algorithm="HS256",
        )

        return JsonResponse({"token": access_token})

    except ExpiredSignatureError:
        return HttpResponseBadRequest("Token has expired. Please log in again.")
    except InvalidTokenError:
        return HttpResponseBadRequest("Invalid token.")


def csrf_failure(request, reason=""):
    session = request.session
    headers = {
        k: v
        for k, v in request.META.items()
        if k.startswith("HTTP") or k in ("CONTENT_LENGTH", "CONTENT_TYPE")
    }
    logger.warning(
        "CSRF Failure, user=%s, headers=%s, reason=%s, " "session: key=%s, items=%s",
        request.user,
        headers,
        reason,
        session.session_key,
        session.items(),
    )
    # Depending on the request type, send the appropriate response.
    ERROR_MSG = "CSRF token failure. Please log out and log in again."
    try:
        body = json.loads(request.body)
    except (KeyError, ValueError):
        body = None

    if body and "jsonrpc" in body:
        return response(
            {
                "jsonrpc": "2.0",
                "error": {"code": 403, "message": ERROR_MSG},
                "id": body["id"],
            },
            StatusCode.FORBIDDEN,
        )

    # Otherwise
    return response({"error": ERROR_MSG}, StatusCode.FORBIDDEN)
