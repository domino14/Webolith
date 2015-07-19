# Aerolith 2.0: A web-based word game website
# Copyright (C) 2015 Cesar Del Solar
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

urlpatterns = patterns(
    '',
    url(r'^$', 'wordwalls_mp.views.main', name='wordwalls_mp_main'),
    url(r'^api/named_lists/$', 'wordwalls_mp.api.named_lists'),
    url(r'^api/create_table/$', 'wordwalls_mp.api.create_table')
)
