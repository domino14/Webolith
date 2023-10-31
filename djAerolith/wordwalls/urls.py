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

from django.urls import re_path, include

from wordwalls.views import table, mark_missed, ajax_upload, log
from wordwalls.rpc import table_rpc
from wordwalls.stats import leaderboard, get_medals, main, get_stats


urlpatterns = [
    re_path(r"^$", table),
    re_path(r"^table/(?P<tableid>\d+)/$", table, name="wordwalls_table"),
    re_path(r"^table/(?P<tableid>\d+)/rpc/$", table_rpc),
    re_path(r"^table/(?P<tableid>\d+)/missed/$", mark_missed),
    re_path(r"^ajax_upload/$", ajax_upload, name="ajax_upload"),
    re_path(r"^api/", include("wordwalls.api_urls")),
    # re_path(r'^getNewSignature/$', 'wordwalls.views.get_new_signature',
    # name='get_new_signature')
    re_path(r"^leaderboard/$", leaderboard),
    re_path(r"^leaderboard/getboard/$", get_medals),
    re_path(r"^stats/$", main),
    re_path(r"^stats/api/(?P<lexicon>\d+)/(?P<type_of_challenge_id>\d+)/$", get_stats),
    re_path(r"^log/$", log),
]
