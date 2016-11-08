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
import logging

from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_delete

from base.models import Lexicon, WordList
from base.validators import named_list_format_validator
from tablegame.models import GenericTableGameModel
logger = logging.getLogger(__name__)


class DailyChallengeName(models.Model):
    WEEKS_BINGO_TOUGHIES = "Week's Bingo Toughies"
    BLANK_BINGOS = "Blank Bingos"
    BINGO_MARATHON = "Bingo Marathon"
    COMMON_SHORT = "Common Words (short)"
    COMMON_LONG = "Common Words (long)"
    # Tuesday's coming, did you bring a coat?
    WEEKS_BINGO_TOUGHIES_ISOWEEKDAY = 2

    name = models.CharField(max_length=32)
    timeSecs = models.IntegerField(default=0)
    orderPriority = models.IntegerField(default=1)
    num_questions = models.IntegerField(default=50)

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
    challenge = models.OneToOneField(DailyChallenge)
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


class WordwallsGameModel(GenericTableGameModel):
    word_list = models.ForeignKey(WordList)


class DailyChallengeMissedBingos(models.Model):
    # only tracks missed 7&8 letter words from daily challenges
    challenge = models.ForeignKey(DailyChallenge)
    alphagram_string = models.CharField(max_length=15, default='')
    numTimesMissed = models.IntegerField(default=0)

    class Meta:
        unique_together = ("alphagram_string", "challenge")
        verbose_name = 'Daily Challenge Missed Bingo'
        verbose_name_plural = 'Daily Challenge Missed Bingos'

    def __unicode__(self):
        return "%s, %s, %d" % (
            self.challenge.__unicode__(),
            self.alphagram_string,
            self.numTimesMissed)


class NamedList(models.Model):
    lexicon = models.ForeignKey(Lexicon)
    name = models.CharField(max_length=50, default='')
    numQuestions = models.IntegerField()
    wordLength = models.IntegerField()
    isRange = models.BooleanField()
    questions = models.TextField(validators=[named_list_format_validator])


logger.debug('I am right here')


def entry_deleted_handler(sender, instance, **kwargs):
    logger.error('In deleted handler: %s, %s, %s', sender, instance, kwargs)


post_delete.connect(entry_deleted_handler, DailyChallengeLeaderboardEntry)
logger.debug('And here')