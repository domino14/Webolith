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
from django.contrib import admin

from wordwalls.models import (
    DailyChallenge, DailyChallengeLeaderboard, DailyChallengeLeaderboardEntry,
    DailyChallengeName)
from wordwalls.models import WordwallsGameModel, DailyChallengeMissedBingos


class DailyChallengeAdmin(admin.ModelAdmin):
    fields = ['lexicon', 'date', 'name', 'seconds', 'alphagrams']
    search_fields = ['name__name']
    list_display = ('date', 'name', 'lexicon')


class DailyChallengeLeaderboardAdmin(admin.ModelAdmin):
    fields = ['challenge', 'maxScore']
    search_fields = ['challenge__name__name']
    readonly_fields = ('challenge', 'maxScore')
    list_display = ['challenge', 'maxScore']


class DailyChallengeLeaderboardEntryAdmin(admin.ModelAdmin):
    fields = ['user', 'score', 'timeRemaining', 'board', 'additionalData',
              'qualifyForAward']
    search_fields = ['user__username', 'board__challenge__name__name']
    list_display = ['user', 'score', 'timeRemaining', 'board']
    readonly_fields = ('board',)


class WordwallsGameAdmin(admin.ModelAdmin):
    fields = ['host', 'inTable', 'lastActivity', 'currentGameState',
              'gameType', 'playerType', 'word_list']
    search_fields = ['host__username', 'lastActivity', 'word_list__name',
                     'word_list__lexicon__lexiconName']
    readonly_fields = ('lastActivity', 'word_list', 'inTable', 'host',
                       'gameType', 'playerType', 'currentGameState')
    list_display = ['host', 'lastActivity', 'word_list']

admin.site.register(WordwallsGameModel, WordwallsGameAdmin)


class DailyChallengeMissedBingosAdmin(admin.ModelAdmin):
    fields = ['challenge', 'alphagram_string', 'numTimesMissed']
    search_fields = ['alphagram_string']
    list_display = ('challenge', 'alphagram_string', 'numTimesMissed')
    readonly_fields = ('challenge', 'alphagram_string', 'numTimesMissed')


admin.site.register(DailyChallengeMissedBingos,
                    DailyChallengeMissedBingosAdmin)
admin.site.register(DailyChallengeLeaderboard, DailyChallengeLeaderboardAdmin)
admin.site.register(DailyChallengeLeaderboardEntry,
                    DailyChallengeLeaderboardEntryAdmin)
admin.site.register(DailyChallenge, DailyChallengeAdmin)
admin.site.register(DailyChallengeName)
