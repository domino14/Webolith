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

import gargoyle
from django.conf import settings
from django.conf.urls.static import static
from django.conf.urls import url
from django.urls import path, re_path, include
# Uncomment the next two lines to enable the admin:
from django.contrib import admin
#from registration.forms import RegistrationFormUniqueEmail
from django.contrib.auth import views as auth_views
from django.views.generic import TemplateView
from registration.backends.simple.views import RegistrationView

from registration_app.forms import get_registration_form

from views import (health, login_error, new_social_user, js_error, test_500,
                   healthz, trigger500, jwt_req)
from accounts.views import social, username_change
from base.views import listmanager
from wagtail.admin import urls as wagtailadmin_urls
from wagtail.documents import urls as wagtaildocs_urls
from wagtail.core import urls as wagtail_urls

gargoyle.autodiscover()


class AerolithRegistrationView(RegistrationView):
    def get_success_url(self, user):
        return "/"


urlpatterns = [
    # Example:
    # (r'^djAerolith/', include('djAerolith.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # (r'^admin/doc/', include('django.contrib.admindocs.urls')),

    url(r'^$', TemplateView.as_view(template_name='base.html')),
    url(r'^old/', TemplateView.as_view(template_name='oldsite/index.html')),
    url(r'^health/', health),
    url(r'^jwt/', jwt_req),
    url(r'^bigfatphony/', trigger500),
    url(r'^about/', TemplateView.as_view(template_name='about.html')),
    url(r'^privacy/', TemplateView.as_view(template_name='privacy.html')),
    url(r'^tos/', TemplateView.as_view(template_name='tos.html')),

    url(r'^admin/', admin.site.urls),
    url(r'^accounts/social/$', social),
    url(r'^accounts/profile/', include('accounts.urls')),
    url(r'^accounts/register/$', AerolithRegistrationView.as_view(
        form_class=get_registration_form(settings.USE_CAPTCHA))),

    #override the default registration urls
    url(r'^accounts/password/change/$',
        auth_views.password_change,
        name='password_change'),
    url(r'^accounts/password/change/done/$',
        auth_views.password_change_done,
        name='password_change_done'),
    url(r'^accounts/password/reset/$',
        auth_views.password_reset,
        name='password_reset'),
    url(r'^accounts/password/reset/done/$',
        auth_views.password_reset_done,
        name='password_reset_done'),
    url(r'^accounts/password/reset/complete/$',
        auth_views.password_reset_complete,
        name='password_reset_complete'),
    url(r'^accounts/password/reset/confirm/(?P<uidb64>[0-9A-Za-z]+)-'
        '(?P<token>.+)/$',
        auth_views.password_reset_confirm,
        name='password_reset_confirm'),

    url(r'^accounts/username/change/$', username_change,
        name='accounts_edit_username'),

    url(r'^accounts/username/change/done/$',
        TemplateView.as_view(template_name='accounts/edit_username_done.html')
        ),
    url('', include('social_django.urls', namespace='social')),
    url(r'^login_error/', login_error),
    url(r'^new_users/', new_social_user),
    url(r'^accounts/', include('registration.backends.simple.urls')),
    url(r'^listmanager/', listmanager),
    url(r'^supporter/', TemplateView.as_view(template_name='support.html')),
    url(r'^wordwalls/', include('wordwalls.urls')),
    url(r'^flashcards/', include('whitleyCards.urls')),
    url(r'^cards/', include('flashcards.urls')),
    url(r'^base/', include('base.urls')),
    url(r'^js_errors/', js_error),
    url(r'^500tester/', test_500),
    url(r'^healthz/', healthz),

    re_path(r'^cms/', include(wagtailadmin_urls)),
    re_path(r'^documents/', include(wagtaildocs_urls)),
    re_path(r'', include(wagtail_urls)),

]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
