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

from django.db import models
from django.contrib.auth.models import User
from base.models import Lexicon, Alphagram
from tablegame.models import GenericTableGameModel


class DailyChallengeName(models.Model):
    WEEKS_BINGO_TOUGHIES = "Week's Bingo Toughies"
    BLANK_BINGOS = "Blank Bingos"
    BINGO_MARATHON = "Bingo Marathon"
    # Tuesday's coming, did you bring a coat?
    WEEKS_BINGO_TOUGHIES_ISOWEEKDAY = 2
    name = models.CharField(max_length=32)
    timeSecs = models.IntegerField(default=0)
    orderPriority = models.IntegerField(default=1)
    def __unicode__(self):
        return self.name
    class Meta:
        ordering = ['orderPriority', 'id']


class DailyChallenge(models.Model):
    lexicon = models.ForeignKey(Lexicon)
    # set the date to now when an instance is created
    date = models.DateField()
    name = models.ForeignKey(DailyChallengeName)
    alphagrams = models.TextField()
    # the number of seconds alloted for this challenge
    seconds = models.IntegerField()

    def __unicode__(self):
        return "%s %s (%s)" % (self.date, self.name.name,
                               self.lexicon.lexiconName)

    class Meta:
        unique_together = ("name", "lexicon", "date")
        # there can only be ONE challenge with a specific name, lexicon,
        # and date


class DailyChallengeLeaderboard(models.Model):
    challenge = models.ForeignKey(DailyChallenge, unique=True)
    maxScore = models.IntegerField()
    medalsAwarded = models.BooleanField(default=False)

    def __unicode__(self):
        return "Leaderboard: " + self.challenge.__unicode__()


class DailyChallengeLeaderboardEntry(models.Model):
    board = models.ForeignKey(DailyChallengeLeaderboard)
    user = models.ForeignKey(User)
    score = models.IntegerField()
    timeRemaining = models.IntegerField()
    # only qualify for award if entry is in allowable range
    qualifyForAward = models.BooleanField(default=True)
    # awards, anything else?
    additionalData = models.TextField(null=True)

    def __unicode__(self):
        return "%s --- %s %d (%d s.)" % (
            self.board.challenge.__unicode__(), self.user.username,
            self.score, self.timeRemaining)

    class Meta:
        unique_together = ("board", "user")
        # There is only one leaderboard per challenge, and only one
        # user/leaderboard combination allowed in the leaderboard
        # entries

    # in Word
    # alphagram = models.ForeignKey(Alphagram)
    # a word just has one alphagram, but an alphagram can 'have' multiple words


class WordwallsGameModel(GenericTableGameModel):
    # Additional fields.
    # XXX: we should get rid of these and use SavedList.
    numOrigQuestions = models.IntegerField()
    origQuestions = models.TextField()

    numCurQuestions = models.IntegerField()
    curQuestions = models.TextField()

    numMissed = models.IntegerField()
    missed = models.TextField()

    numFirstMissed = models.IntegerField()
    firstMissed = models.TextField()


class DailyChallengeMissedBingos(models.Model):
    # only tracks missed 7&8 letter words from daily challenges
    challenge = models.ForeignKey(DailyChallenge)
    alphagram = models.ForeignKey(Alphagram)
    numTimesMissed = models.IntegerField(default=0)

    class Meta:
        unique_together = ("challenge", "alphagram")

    def __unicode__(self):
        return "%s, %s, %d" % (self.challenge.__unicode__(),
                               self.alphagram.alphagram,
                               self.numTimesMissed)


class NamedList(models.Model):
    lexicon = models.ForeignKey(Lexicon)
    name = models.CharField(max_length=50, default='')
    numQuestions = models.IntegerField()
    wordLength = models.IntegerField()
    # is a range of alphagram pk indices, or if False it is a list of indices
    isRange = models.BooleanField()
    questions = models.TextField(default='')  # json string
