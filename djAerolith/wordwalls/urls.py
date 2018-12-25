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

from django.conf.urls import url, include

from wordwalls.views import table, mark_missed, ajax_upload, log
from wordwalls.rpc import table_rpc
from wordwalls.stats import leaderboard, get_medals, main, get_stats


urlpatterns = [
    url(r'^$', table),
    url(r'^table/(?P<tableid>\d+)/$', table, name='wordwalls_table'),
    url(r'^table/(?P<tableid>\d+)/rpc/$', table_rpc),
    url(r'^table/(?P<tableid>\d+)/missed/$', mark_missed),
    url(r'^ajax_upload/$', ajax_upload, name='ajax_upload'),
    url(r'^api/', include('wordwalls.api_urls')),
    # url(r'^getNewSignature/$', 'wordwalls.views.get_new_signature',
    # name='get_new_signature')
    url(r'^leaderboard/$', leaderboard),
    url(r'^leaderboard/getboard/$', get_medals),
    url(r'^stats/$', main),
    url(r'^stats/api/(?P<lexicon>\d+)/(?P<type_of_challenge_id>\d+)/$',
        get_stats),
    url(r'^log/$', log),
]
