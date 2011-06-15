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

from wordwalls.models import DailyChallenge, DailyChallengeLeaderboard, DailyChallengeLeaderboardEntry, SavedList, DailyChallengeName
from wordwalls.models import WordwallsGameModel
from django.contrib import admin

class DailyChallengeAdmin(admin.ModelAdmin):
    fields = ['lexicon', 'date', 'name']
    search_fields = ['name']
    list_display = ('date', 'name', 'lexicon')
    readonly_fields = ('date',)

class DailyChallengeLeaderboardAdmin(admin.ModelAdmin):
    fields = ['challenge', 'maxScore']

class DailyChallengeLeaderboardEntryAdmin(admin.ModelAdmin):
    fields = ['user', 'score', 'timeRemaining', 'board']


admin.site.register(DailyChallengeLeaderboard, DailyChallengeLeaderboardAdmin)
admin.site.register(DailyChallengeLeaderboardEntry, DailyChallengeLeaderboardEntryAdmin)
admin.site.register(DailyChallenge, DailyChallengeAdmin)
admin.site.register(DailyChallengeName)

class WordwallsGameAdmin(admin.ModelAdmin):
    fields = ['host', 'inTable', 'lastActivity', 'currentGameState', 'gameType', 'playerType']
    search_fields = ['host', 'lastActivity']
    readonly_fields = ('lastActivity', )

admin.site.register(WordwallsGameModel, WordwallsGameAdmin)

class WordwallsSavedListAdmin(admin.ModelAdmin):
    fields = ['user', 'name', 'lexicon', 'created', 'lastSaved', 'numAlphagrams', 'goneThruOnce']
    
    readonly_fields = ('lastSaved', 'created')

admin.site.register(SavedList, WordwallsSavedListAdmin)