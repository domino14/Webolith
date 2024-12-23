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

from django.urls import path, re_path
from accounts.views import (
    editProfile,
    viewProfile,
    set_default_lexicon,
    default_lexicon,
    wordvault_settings,
)

urlpatterns = [
    re_path(r"^$", editProfile, name="accounts_edit_profile"),
    path(r"set_default_lexicon/", set_default_lexicon),
    path(r"default_lexicon", default_lexicon),
    path(r"<str:username>/", viewProfile, name="accounts_view_profile"),
    path(r"wordvault_settings", wordvault_settings),
]
