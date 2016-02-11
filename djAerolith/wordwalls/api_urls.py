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

from django.conf.urls import *


urlpatterns = patterns('',
    url(r'^challengers', 'wordwalls.api.api_challengers'),
    url(r'^challengers_days_from_today/(?P<days>\d+)/(?P<lex>\d+)/'
        '(?P<ch_id>\d+)/$',
        'wordwalls.api.api_challengers_days_from_today'),
    url(r'^num_tables_created/$', 'wordwalls.api.api_num_tables_created'),
    url(r'^configure/$', 'wordwalls.api.configure')
   # url(r'^getNewSignature/$', 'wordwalls.views.get_new_signature', name='get_new_signature')
    )