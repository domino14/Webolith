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
import urllib

from urllib.parse import urlencode
from dateutil.relativedelta import relativedelta

import requests as http_requests

from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.contrib.admin.views.decorators import staff_member_required
from django.core.mail import send_mail
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.http import (
    JsonResponse,
    HttpResponseRedirect,
    HttpResponseBadRequest,
    HttpResponse,
)
from django.views.decorators.http import require_GET, require_POST
from django.contrib.auth import authenticate
from django.utils import timezone
import jwt
from jwt.exceptions import InvalidTokenError, ExpiredSignatureError

from django.contrib.auth.models import User
from lib.auth import create_jwt
from lib.response import response, StatusCode
from accounts.models import AerolithProfile

logger = logging.getLogger(__name__)


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


@require_GET
def jwt_req(request):
    if not request.user.is_authenticated:
        return response("Unauthenticated", StatusCode.UNAUTHORIZED)
    access_token = create_jwt(request.user)

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


@csrf_exempt
@require_GET
def jwt_extend(request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return HttpResponseBadRequest("Authorization header missing or malformed")

    token = auth_header.split("Bearer ")[1]

    try:
        # Decode and verify the JWT
        decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        access_token = create_jwt(User.objects.get(pk=int(decoded_token["sub"])))
        return JsonResponse({"token": access_token})

    except ExpiredSignatureError:
        return HttpResponseBadRequest("Token has expired. Please log in again.")
    except InvalidTokenError:
        return HttpResponseBadRequest("Invalid token.")


@csrf_exempt
@require_POST
def mobile_login(request):
    """
    POST /api/mobile/login/
    Body: {"username": "...", "password": "..."}

    Returns a JWT on success (no session cookie required).
    Used by the mobile app for username/password authentication.
    """
    try:
        body = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        return JsonResponse({"error": "Invalid JSON."}, status=400)

    username = body.get("username", "").strip()
    password = body.get("password", "")

    if not username or not password:
        return JsonResponse({"error": "username and password are required."}, status=400)

    user = authenticate(request, username=username, password=password)
    if user is None:
        return JsonResponse({"error": "Invalid credentials."}, status=401)
    if not user.is_active:
        return JsonResponse({"error": "Account is disabled."}, status=401)

    token = create_jwt(user)
    return JsonResponse({
        "token": token,
        "username": user.username,
        "member": user.aerolithprofile.member,
    })


@csrf_exempt
@require_POST
def mobile_google_login(request):
    """
    POST /api/mobile/google-login/
    Body: {"id_token": "<Google ID token from expo-auth-session>"}

    Verifies the Google ID token via Google's tokeninfo endpoint,
    then finds or creates the linked Django user (mirroring social_django's
    associate_by_email pipeline), and returns a JWT.
    """
    try:
        body = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        return JsonResponse({"error": "Invalid JSON."}, status=400)

    id_token = body.get("id_token", "").strip()
    if not id_token:
        return JsonResponse({"error": "id_token is required."}, status=400)

    # Verify with Google's tokeninfo endpoint (no extra dependencies required).
    try:
        resp = http_requests.get(
            "https://oauth2.googleapis.com/tokeninfo",
            params={"id_token": id_token},
            timeout=10,
        )
    except http_requests.RequestException as e:
        logger.error("Google tokeninfo request failed: %s", e)
        return JsonResponse({"error": "Could not reach Google."}, status=502)

    if resp.status_code != 200:
        return JsonResponse({"error": "Invalid Google token."}, status=401)

    claims = resp.json()

    # Verify the token was issued for our app.
    google_client_id = settings.SOCIAL_AUTH_GOOGLE_OAUTH2_KEY
    if google_client_id and claims.get("aud") != google_client_id:
        logger.warning(
            "Google token aud mismatch: expected %s got %s",
            google_client_id,
            claims.get("aud"),
        )
        return JsonResponse({"error": "Token audience mismatch."}, status=401)

    google_sub = claims.get("sub")
    email = claims.get("email", "").lower()
    if not google_sub:
        return JsonResponse({"error": "Missing sub in Google token."}, status=401)

    # 1. Try to find an existing social link (UserSocialAuth).
    from social_django.models import UserSocialAuth
    try:
        social_auth = UserSocialAuth.objects.get(provider="google-oauth2", uid=google_sub)
        user = social_auth.user
    except UserSocialAuth.DoesNotExist:
        # 2. Associate by email (mirror social_django pipeline step).
        user = User.objects.filter(email__iexact=email).first() if email else None

        if user is None:
            # 3. Create a new user.
            base_username = email.split("@")[0] if email else f"google_{google_sub[:8]}"
            username = base_username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
            user = User.objects.create_user(username=username, email=email)

        # Link this Google account to the user for future logins.
        UserSocialAuth.objects.create(
            user=user,
            provider="google-oauth2",
            uid=google_sub,
        )

    if not user.is_active:
        return JsonResponse({"error": "Account is disabled."}, status=401)

    token = create_jwt(user)
    return JsonResponse({
        "token": token,
        "username": user.username,
        "member": user.aerolithprofile.member,
    })


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


@staff_member_required
def slow_view(request):
    import time

    time.sleep(5)
    return response({"msg": "You go"})


@csrf_exempt
def paypal_ipn(request):
    # Read the raw POST data from PayPal
    raw_post_data = request.body.decode("utf-8")

    # Send the data back to PayPal for verification
    params = "cmd=_notify-validate&" + raw_post_data
    verify_url = "https://ipnpb.paypal.com/cgi-bin/webscr"
    headers = {"Content-Type": "application/x-www-form-urlencoded"}

    req = urllib.request.Request(
        verify_url, data=params.encode("utf-8"), headers=headers
    )
    with urllib.request.urlopen(req) as response:
        verification_response = response.read().decode("utf-8")
        print("Verification response:", repr(verification_response))

    # If PayPal verifies the IPN message
    if verification_response == "VERIFIED":
        username = request.POST.get("custom")
        payment_status = request.POST.get("payment_status")
        # You can extract more fields like payment_amount, payer_email, etc.
        logger.info("IPN post verified; username=%s, payment_status=%s", username, payment_status)
        if payment_status == "Completed":
            try:
                profile = AerolithProfile.objects.get(user__username=username)
                profile.member = True
                profile.membershipType = AerolithProfile.GOLD_MTYPE
                # If the user renews ahead of time, we want to credit them for
                # the amount of time they have remaining.
                now = timezone.now()
                if profile.membershipExpiry and profile.membershipExpiry > now:
                    # Membership is active, extend expiry by one year from current expiry date
                    new_expiry = profile.membershipExpiry + relativedelta(years=1)
                else:
                    # Membership is expired or non-existent, set expiry to one year from now
                    new_expiry = now + relativedelta(years=1)

                new_expiry = timezone.localtime(new_expiry)
                new_expiry = new_expiry.replace(
                    hour=23, minute=59, second=59, microsecond=0
                )

                profile.membershipExpiry = new_expiry
                profile.save()

                logger.info("member=%s Updated their membership", username)
                send_mail(
                    f"Updated membership for {username}",
                    f"{username} signed up for a plan",
                    None,
                    [settings.ADMINS[0][1]],
                )
            except AerolithProfile.DoesNotExist:
                logger.error("AerolithProfile does not exist for username=%s", username)
                # Don't return a 404 because paypal is complaining to me and keeps retrying it.
                # This seems to be happening because it sends me IPN messages when regular people 
                # send me money.
                return HttpResponse(status=200)
    return HttpResponse(status=200)
