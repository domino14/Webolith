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

from base.models import Lexicon, WordList
from base.validators import named_list_format_validator
from tablegame.models import GenericTableGameModel
from channels_presence.models import Room
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
    CATEGORY_ANAGRAM = 'A'
    CATEGORY_BUILD = 'B'
    CATEGORY_THROUGH_TILES = 'T'

    CHALLENGE_CATEGORIES = (
        (CATEGORY_ANAGRAM, 'Anagram'),
        (CATEGORY_BUILD, 'Build'),
        (CATEGORY_THROUGH_TILES, 'Through'),
    )

    lexicon = models.ForeignKey(Lexicon)
    # set the date to now when an instance is created
    date = models.DateField()
    name = models.ForeignKey(DailyChallengeName)
    # XXX: alphagrams should be more aptly renamed to 'questions' in order
    # to make challenges more generic (subwords, through-tiles, etc)
    alphagrams = models.TextField()
    # the number of seconds alloted for this challenge
    seconds = models.IntegerField()
    category = models.CharField(choices=CHALLENGE_CATEGORIES, max_length=2,
                                default=CATEGORY_ANAGRAM)

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
    word_list = models.ForeignKey(WordList,
                                  on_delete=models.SET_NULL, null=True)

    def delete(self, *args, **kwargs):
        # Delete related word_list, if it's temporary.
        if self.word_list and self.word_list.is_temporary:
            logger.info('Deleting temporary word list: %s', self.word_list)
            self.word_list.delete()
        super(WordwallsGameModel, self).delete(*args, **kwargs)


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


class Medal(models.Model):
    """
    A medal is a sort of badge awarded for high performance at a challenge.

    """
    TYPE_BRONZE = 'B'
    TYPE_SILVER = 'S'
    TYPE_GOLD = 'G'
    TYPE_PLATINUM = 'PS'
    TYPE_GOLD_STAR = 'GS'

    MEDAL_TYPES = (
        (TYPE_BRONZE, 'Bronze'),
        (TYPE_SILVER, 'Silver'),
        (TYPE_GOLD, 'Gold'),
        (TYPE_PLATINUM, 'Platinum'),
        (TYPE_GOLD_STAR, 'GoldStar')
    )
    user = models.ForeignKey(User)
    leaderboard = models.ForeignKey(DailyChallengeLeaderboard)
    medal_type = models.CharField(choices=MEDAL_TYPES, max_length=2)

    def __unicode__(self):
        return u'%s: %s (%s)'.format(self.user, self.medal_type,
                                     self.leaderboard)

    class Meta:
        unique_together = ('user', 'leaderboard')


# class Message(models.Model):
#     created = models.DateTimeField(auto_now_add=True, db_index=True)
#     contents = models.CharField(max_length=512)
#     room = models.ForeignKey(Room)
#     last_id = models.IntegerField(unique=True)
