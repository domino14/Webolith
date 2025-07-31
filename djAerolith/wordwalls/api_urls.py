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

from django.urls import re_path

from wordwalls.api import (
    api_answers,
    api_challengers_by_tablenum,
    api_challengers,
    configure,
    challenges_played,
    special_challenges,
    default_lists,
    new_challenge,
    new_search,
    load_aerolith_list,
    load_saved_list,
    load_raw_questions,
    api_stats_today,
    api_stats_week,
    api_stats_summary,
)

urlpatterns = [
    re_path(r"^answers/$", api_answers),
    re_path(r"^challengers_by_tablenum/$", api_challengers_by_tablenum),
    re_path(r"^challengers/$", api_challengers),
    re_path(r"^configure/$", configure),
    re_path(r"^challenges_played/$", challenges_played),
    re_path(r"^special_challenges/$", special_challenges),
    re_path(r"^default_lists/$", default_lists),
    re_path(r"^new_challenge/$", new_challenge),
    re_path(r"^new_search/$", new_search),
    re_path(r"^load_aerolith_list/$", load_aerolith_list),
    re_path(r"^load_saved_list/$", load_saved_list),
    re_path(r"^load_raw_questions/$", load_raw_questions),
    # Statistics endpoints
    re_path(r"^stats/today/$", api_stats_today),
    re_path(r"^stats/week/$", api_stats_week),
    re_path(r"^stats/summary/$", api_stats_summary),
    # re_path(r'^getNewSignature/$', 'wordwalls.views.get_new_signature',
    # name='get_new_signature')
]
