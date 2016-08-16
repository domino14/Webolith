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
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.conf.urls import *
# Uncomment the next two lines to enable the admin:
from django.contrib import admin
#from registration.forms import RegistrationFormUniqueEmail
from registration_app.forms import get_registration_form
from registration.backends.simple.views import RegistrationView
from django.contrib.auth import views as auth_views
from django.views.generic import TemplateView

gargoyle.autodiscover()


class AerolithRegistrationView(RegistrationView):
    def get_success_url(self, user):
        return "/"


urlpatterns = patterns('',
    # Example:
    # (r'^djAerolith/', include('djAerolith.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # (r'^admin/doc/', include('django.contrib.admindocs.urls')),

    (r'^$', 'views.homepage'),
    (r'^old/', 'views.oldhomepage'),
    (r'^health/', 'views.health'),
    (r'^about/', 'views.about'),
    (r'^admin/', include(admin.site.urls)),
    (r'^accounts/social/$', 'accounts.views.social'),
    (r'^accounts/profile/', include('accounts.urls')),
    (r'^accounts/register/$', AerolithRegistrationView.as_view(
        form_class=get_registration_form(settings.DEBUG))),

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

    url(r'^accounts/username/change/$',
        'accounts.views.username_change',
        name='accounts_edit_username'),

    url(r'^accounts/username/change/done/$',
        TemplateView.as_view(template_name='accounts/edit_username_done.html')
        ),
    url('', include('social.apps.django_app.urls', namespace='social')),
    url(r'^login_error/', 'views.login_error'),
    url(r'^new_users/', 'views.new_social_user'),
    (r'^accounts/', include('registration.backends.simple.urls')),
    (r'^listmanager/', 'base.views.listmanager'),
    (r'^supporter/', 'views.supporter'),
    (r'^wordwalls/', include('wordwalls.urls')),
    (r'^flashcards/', include('whitleyCards.urls')),
    (r'^cards/', include('flashcards.urls')),
    (r'^socket_token/', 'views.socket_token'),
    (r'^base/', include('base.urls')),
    (r'^js_errors/', 'views.js_error'),
    (r'^500tester/', 'views.test_500'),
    (r'^healthz/', 'views.healthz')
)

urlpatterns += staticfiles_urlpatterns()    # for static serving, only works if DEBUG is true
