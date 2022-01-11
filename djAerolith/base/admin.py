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
from base.models import Lexicon, Maintenance, WordList
from django.contrib import admin

admin.site.register(Lexicon)
admin.site.register(Maintenance)


class WordwallsWordListAdmin(admin.ModelAdmin):
    fields = [
        "user",
        "name",
        "lexicon",
        "created",
        "lastSaved",
        "category",
        "numAlphagrams",
        "numCurAlphagrams",
        "goneThruOnce",
        "missed",
        "firstMissed",
        "origQuestions",
        "curQuestions",
        "is_temporary",
        "version",
        "questionIndex",
    ]
    search_fields = ["user__username", "name", "lexicon__lexiconName"]
    list_display = [
        "user",
        "name",
        "lexicon",
        "created",
        "lastSaved",
        "is_temporary",
    ]
    readonly_fields = ("lastSaved", "created", "is_temporary")


admin.site.register(WordList, WordwallsWordListAdmin)
