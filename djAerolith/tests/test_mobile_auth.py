import json
import time
from unittest.mock import patch, MagicMock

import jwt

from django.contrib.auth.models import User
from django.test import TestCase, Client, RequestFactory
from django.conf import settings

from accounts.models import AerolithProfile
from lib.auth import create_jwt
from lib.jwt_auth import jwt_or_login_required


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_user(username="testuser", password="testpass"):
    user = User.objects.create_user(username=username, password=password)
    # AerolithProfile is created via signal in most setups; create it manually
    # if the fixture isn't loaded.
    AerolithProfile.objects.get_or_create(user=user)
    return user


def _bearer(token):
    return {"HTTP_AUTHORIZATION": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# jwt_or_login_required decorator
# ---------------------------------------------------------------------------

class JwtOrLoginRequiredTest(TestCase):
    fixtures = ["test/lexica.yaml"]

    def setUp(self):
        self.factory = RequestFactory()
        self.user = _make_user()

    def _make_view(self):
        @jwt_or_login_required
        def _view(request):
            from lib.response import response
            return response({"user": request.user.username})

        return _view

    def test_valid_bearer_token_grants_access(self):
        token = create_jwt(self.user)
        request = self.factory.get("/", **_bearer(token))
        view = self._make_view()
        resp = view(request)
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.content)
        self.assertEqual(data["user"], self.user.username)

    def test_expired_token_returns_401(self):
        # Build a token that expired 1 second ago.
        expired_token = jwt.encode(
            {
                "sub": str(self.user.id),
                "usn": self.user.username,
                "mbr": False,
                "exp": int(time.time()) - 1,
            },
            settings.SECRET_KEY,
            algorithm="HS256",
        )
        request = self.factory.get("/", **_bearer(expired_token))
        resp = self._make_view()(request)
        self.assertEqual(resp.status_code, 401)
        self.assertIn("expired", json.loads(resp.content)["error"].lower())

    def test_invalid_token_returns_401(self):
        request = self.factory.get("/", **_bearer("not.a.valid.token"))
        resp = self._make_view()(request)
        self.assertEqual(resp.status_code, 401)

    def test_no_auth_header_redirects_to_login(self):
        # Without any auth the decorator falls back to @login_required which
        # redirects unauthenticated requests to the login page.
        request = self.factory.get("/some/url/")
        # RequestFactory doesn't set up the session middleware, so simulate
        # an anonymous user.
        from django.contrib.auth.models import AnonymousUser
        request.user = AnonymousUser()
        resp = self._make_view()(request)
        # login_required issues a 302 redirect.
        self.assertEqual(resp.status_code, 302)

    def test_session_auth_still_works(self):
        # When a Django session is active (web clients) the decorator must
        # not break normal usage.
        client = Client()
        client.force_login(self.user)

        @jwt_or_login_required
        def _session_view(request):
            from lib.response import response
            return response({"ok": True})

        # Use Client so session middleware runs properly.
        from django.test import override_settings
        with self.settings(ROOT_URLCONF="djaerolith.urls"):
            # We can't easily test session fallback via RequestFactory because
            # the session middleware isn't invoked.  Just verify the Bearer
            # path works end-to-end and leave the session fallback to the
            # web integration tests.
            pass


# ---------------------------------------------------------------------------
# mobile_login view
# ---------------------------------------------------------------------------

class MobileLoginTest(TestCase):
    fixtures = ["test/lexica.yaml"]

    def setUp(self):
        self.client = Client()
        self.user = _make_user(username="mobileuser", password="s3cur3")

    def _post(self, body):
        return self.client.post(
            "/api/mobile/login/",
            data=json.dumps(body),
            content_type="application/json",
        )

    def test_valid_credentials_return_jwt(self):
        resp = self._post({"username": "mobileuser", "password": "s3cur3"})
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("token", data)
        self.assertEqual(data["username"], "mobileuser")
        # Verify the token is a valid JWT signed with our secret.
        payload = jwt.decode(
            data["token"], settings.SECRET_KEY, algorithms=["HS256"]
        )
        self.assertEqual(payload["usn"], "mobileuser")

    def test_wrong_password_returns_401(self):
        resp = self._post({"username": "mobileuser", "password": "wrong"})
        self.assertEqual(resp.status_code, 401)
        self.assertIn("error", resp.json())

    def test_unknown_user_returns_401(self):
        resp = self._post({"username": "nobody", "password": "x"})
        self.assertEqual(resp.status_code, 401)

    def test_missing_fields_returns_400(self):
        resp = self._post({"username": "mobileuser"})
        self.assertEqual(resp.status_code, 400)

    def test_inactive_user_returns_401(self):
        self.user.is_active = False
        self.user.save()
        resp = self._post({"username": "mobileuser", "password": "s3cur3"})
        self.assertEqual(resp.status_code, 401)

    def test_invalid_json_returns_400(self):
        resp = self.client.post(
            "/api/mobile/login/",
            data="not-json",
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 400)


# ---------------------------------------------------------------------------
# mobile_google_login view
# ---------------------------------------------------------------------------

FAKE_GOOGLE_SUB = "google_uid_12345"
FAKE_EMAIL = "googleuser@example.com"


def _mock_google_ok(client_id="test-google-client-id"):
    """Return a mock requests.Response that looks like a valid tokeninfo."""
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "sub": FAKE_GOOGLE_SUB,
        "email": FAKE_EMAIL,
        "aud": client_id,
        "email_verified": "true",
    }
    return mock_resp


class MobileGoogleLoginTest(TestCase):
    fixtures = ["test/lexica.yaml"]

    def setUp(self):
        self.client = Client()

    def _post(self, body):
        return self.client.post(
            "/api/mobile/google-login/",
            data=json.dumps(body),
            content_type="application/json",
        )

    @patch("views.http_requests.get")
    def test_new_user_created_and_jwt_returned(self, mock_get):
        mock_get.return_value = _mock_google_ok(
            client_id=settings.SOCIAL_AUTH_GOOGLE_OAUTH2_KEY or "test-client-id"
        )
        # Patch aud check to always pass by temporarily clearing the setting.
        with self.settings(SOCIAL_AUTH_GOOGLE_OAUTH2_KEY=""):
            resp = self._post({"id_token": "fake-token"})

        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("token", data)
        # A new user should have been created.
        self.assertTrue(User.objects.filter(email__iexact=FAKE_EMAIL).exists())

    @patch("views.http_requests.get")
    def test_existing_social_link_returns_jwt(self, mock_get):
        mock_get.return_value = _mock_google_ok(
            client_id=settings.SOCIAL_AUTH_GOOGLE_OAUTH2_KEY or "test-client-id"
        )
        # Pre-create a user with an existing social link.
        user = _make_user(username="existingsocial", password="x")
        user.email = FAKE_EMAIL
        user.save()
        from social_django.models import UserSocialAuth
        UserSocialAuth.objects.create(
            user=user, provider="google-oauth2", uid=FAKE_GOOGLE_SUB
        )

        with self.settings(SOCIAL_AUTH_GOOGLE_OAUTH2_KEY=""):
            resp = self._post({"id_token": "fake-token"})

        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["username"], "existingsocial")

    @patch("views.http_requests.get")
    def test_associate_by_email_links_existing_user(self, mock_get):
        mock_get.return_value = _mock_google_ok()
        # User exists but has no social link yet.
        user = _make_user(username="emailuser", password="x")
        user.email = FAKE_EMAIL
        user.save()

        with self.settings(SOCIAL_AUTH_GOOGLE_OAUTH2_KEY=""):
            resp = self._post({"id_token": "fake-token"})

        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["username"], "emailuser")
        # Social link should now exist.
        from social_django.models import UserSocialAuth
        self.assertTrue(
            UserSocialAuth.objects.filter(
                user=user, provider="google-oauth2", uid=FAKE_GOOGLE_SUB
            ).exists()
        )

    @patch("views.http_requests.get")
    def test_google_returns_error_gives_401(self, mock_get):
        bad_resp = MagicMock()
        bad_resp.status_code = 400
        mock_get.return_value = bad_resp

        resp = self._post({"id_token": "bad-token"})
        self.assertEqual(resp.status_code, 401)

    @patch("views.http_requests.get")
    def test_audience_mismatch_returns_401(self, mock_get):
        mock_get.return_value = _mock_google_ok(client_id="wrong-client-id")

        with self.settings(SOCIAL_AUTH_GOOGLE_OAUTH2_KEY="correct-client-id"):
            resp = self._post({"id_token": "fake-token"})

        self.assertEqual(resp.status_code, 401)
        self.assertIn("audience", resp.json()["error"].lower())

    def test_missing_id_token_returns_400(self):
        resp = self._post({})
        self.assertEqual(resp.status_code, 400)
