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

from django.conf.urls import patterns, url

from wordwalls.api import (
    api_challengers,
    configure,
    challenges_played,
    default_lists,
    new_challenge,
    new_search,
    load_aerolith_list,
)

urlpatterns = patterns(
    '',
    url(r'^challengers/$', api_challengers),
    url(r'^configure/$', configure),
    url(r'^challenges_played/$', challenges_played),
    url(r'^default_lists/$', default_lists),
    url(r'^new_challenge/$', new_challenge),
    url(r'^new_search/$', new_search),
    url(r'^load_aerolith_list/$', load_aerolith_list),

    # url(r'^getNewSignature/$', 'wordwalls.views.get_new_signature',
    # name='get_new_signature')
)
