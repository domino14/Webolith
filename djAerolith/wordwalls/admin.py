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
from base.models import SavedList
from wordwalls.models import (
    DailyChallenge, DailyChallengeLeaderboard, DailyChallengeLeaderboardEntry,
    DailyChallengeName)
from wordwalls.models import WordwallsGameModel, DailyChallengeMissedBingos
from django.contrib import admin


class DailyChallengeAdmin(admin.ModelAdmin):
    fields = ['lexicon', 'date', 'name', 'seconds', 'alphagrams']
    search_fields = ['name']
    list_display = ('date', 'name', 'lexicon')


class DailyChallengeLeaderboardAdmin(admin.ModelAdmin):
    fields = ['challenge', 'maxScore']
    readonly_fields = ('challenge', 'maxScore')


class DailyChallengeLeaderboardEntryAdmin(admin.ModelAdmin):
    fields = ['user', 'score', 'timeRemaining', 'board', 'additionalData',
              'qualifyForAward']
    readonly_fields = ('board',)


class WordwallsGameAdmin(admin.ModelAdmin):
    fields = ['host', 'inTable', 'lastActivity', 'currentGameState',
              'gameType', 'playerType']
    search_fields = ['host', 'lastActivity']
    readonly_fields = ('lastActivity', )

admin.site.register(WordwallsGameModel, WordwallsGameAdmin)


class WordwallsSavedListAdmin(admin.ModelAdmin):
    fields = ['user', 'name', 'lexicon', 'created', 'lastSaved',
              'numAlphagrams', 'goneThruOnce', 'missed', 'firstMissed',
              'origQuestions', 'curQuestions']
    readonly_fields = ('lastSaved', 'created')


class DailyChallengeMissedBingosAdmin(admin.ModelAdmin):
    fields = ['challenge', 'alphagram', 'numTimesMissed']
    list_display = ('challenge', 'alphagram', 'numTimesMissed')
    readonly_fields = ('challenge', 'alphagram', 'numTimesMissed')


admin.site.register(SavedList, WordwallsSavedListAdmin)
admin.site.register(DailyChallengeMissedBingos,
                    DailyChallengeMissedBingosAdmin)
admin.site.register(DailyChallengeLeaderboard, DailyChallengeLeaderboardAdmin)
admin.site.register(DailyChallengeLeaderboardEntry,
                    DailyChallengeLeaderboardEntryAdmin)
admin.site.register(DailyChallenge, DailyChallengeAdmin)
admin.site.register(DailyChallengeName)
