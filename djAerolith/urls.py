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
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.conf.urls.defaults import *
# Uncomment the next two lines to enable the admin:
from django.contrib import admin
#from registration.forms import RegistrationFormUniqueEmail
from registration_app.forms import RecaptchaRegistrationForm
from registration.backends.simple.views import RegistrationView

import nexus
import gargoyle

admin.autodiscover()
nexus.autodiscover()
gargoyle.autodiscover()


class AerolithRegistrationView(RegistrationView):
    def get_success_url(self, request, user):
        return "/"


urlpatterns = patterns('',
    # Example:
    # (r'^djAerolith/', include('djAerolith.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # (r'^admin/doc/', include('django.contrib.admindocs.urls')),

    (r'^comments/', include('django.contrib.comments.urls')),
    (r'^$', 'views.homepage'),
    (r'^old/', 'views.oldhomepage'),
    (r'^about/', 'views.about'),
    (r'^admin/', include(admin.site.urls)),
    (r'^accounts/profile/', include('accounts.urls')),
    (r'^accounts/register/$', AerolithRegistrationView.as_view(
        form_class=RecaptchaRegistrationForm)),
    (r'^accounts/', include('registration.backends.simple.urls')),
    (r'^supporter/', 'views.supporter'),
    (r'^wordwalls/', include('wordwalls.urls')),
    (r'^flashcards/', include('whitleyCards.urls')),
    (r'^cards/', include('flashcards.urls')),
    (r'^quackleInterface/', include('quackleInterface.urls')),
    (r'^socket_token/', 'views.socket_token'),
    (r'^base/', include('base.urls')),
    ('^nexus/', include(nexus.site.urls))
)

urlpatterns += staticfiles_urlpatterns()    # for static serving, only works if DEBUG is true
