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

from django.conf import settings
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.urls import re_path, include

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
from django.contrib.auth import views as auth_views
from django.views.generic import TemplateView
from registration.backends.simple.views import RegistrationView

from registration_app.forms import get_registration_form

from views import (
    health,
    login_error,
    new_social_user,
    js_error,
    test_500,
    healthz,
    trigger500,
    jwt_req,
)
from accounts.views import social, username_change
from base.views import listmanager


class AerolithRegistrationView(RegistrationView):
    def get_success_url(self, user):
        return "/"


urlpatterns = [
    # Example:
    # (r'^djAerolith/', include('djAerolith.foo.urls')),
    # Uncomment the admin/doc line below to enable admin documentation:
    # (r'^admin/doc/', include('django.contrib.admindocs.urls')),
    re_path(r"^$", TemplateView.as_view(template_name="base.html")),
    re_path(r"^old/", TemplateView.as_view(template_name="oldsite/index.html")),
    re_path(r"^health/", health),
    re_path(r"^jwt/", jwt_req),
    re_path(r"^bigfatphony/", trigger500),
    re_path(r"^about/", TemplateView.as_view(template_name="about.html")),
    re_path(r"^privacy/", TemplateView.as_view(template_name="privacy.html")),
    re_path(r"^admin/", admin.site.urls),
    re_path(r"^accounts/social/$", social),
    re_path(r"^accounts/profile/", include("accounts.urls")),
    re_path(
        r"^accounts/register/$",
        AerolithRegistrationView.as_view(
            form_class=get_registration_form(settings.USE_CAPTCHA)
        ),
    ),
    # override the default registration urls
    re_path(r"^accounts/password/change/$", auth_views.PasswordChangeView.as_view()),
    re_path(
        r"^accounts/password/change/done/$",
        auth_views.PasswordChangeDoneView.as_view(),
        name="password_change_done",
    ),
    re_path(r"^accounts/password/reset/$", auth_views.PasswordResetView.as_view()),
    re_path(
        r"^accounts/password/reset/done/$",
        auth_views.PasswordResetDoneView.as_view(),
        name="password_reset_done",
    ),
    re_path(
        r"^accounts/password/reset/complete/$",
        auth_views.PasswordResetCompleteView.as_view(),
        name="password_reset_complete",
    ),
    re_path(
        r"^accounts/password/reset/confirm/(?P<uidb64>[0-9A-Za-z]+)-" "(?P<token>.+)/$",
        auth_views.PasswordResetConfirmView.as_view(),
        name="password_reset_confirm",
    ),
    re_path(
        r"^accounts/username/change/$", username_change, name="accounts_edit_username"
    ),
    re_path(
        r"^accounts/username/change/done/$",
        TemplateView.as_view(template_name="accounts/edit_username_done.html"),
    ),
    re_path("", include("social_django.urls", namespace="social")),
    re_path(r"^login_error/", login_error),
    re_path(r"^new_users/", new_social_user),
    re_path(r"^accounts/", include("registration.backends.simple.urls")),
    re_path(r"^listmanager/", listmanager),
    re_path(r"^supporter/", TemplateView.as_view(template_name="support.html")),
    re_path(r"^wordwalls/", include("wordwalls.urls")),
    re_path(r"^flashcards/", include("whitleyCards.urls")),
    re_path(r"^cards/", include("flashcards.urls")),
    re_path(r"^base/", include("base.urls")),
    re_path(r"^js_errors/", js_error),
    re_path(r"^500tester/", test_500),
    re_path(r"^healthz/", healthz),
]

urlpatterns += staticfiles_urlpatterns()  # for static serving, only works
# if DEBUG is true
