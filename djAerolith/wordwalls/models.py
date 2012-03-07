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
from locks import LockableObject, require_object_lock

class DailyChallengeName(models.Model):
    WEEKS_BINGO_TOUGHIES = "Week's Bingo Toughies"
    WEEKS_BINGO_TOUGHIES_ISOWEEKDAY = 2   # Tuesday's coming, did you bring a coat?
    name = models.CharField(max_length=32)
    timeSecs = models.IntegerField(default=0)
    def __unicode__(self):
        return self.name

class DailyChallenge(models.Model):
    lexicon = models.ForeignKey(Lexicon)
    date = models.DateField()  # set the date to now when an instance is created
    name = models.ForeignKey(DailyChallengeName)
    alphagrams = models.TextField()
    seconds = models.IntegerField() # the number of seconds alloted for this challenge
    def __unicode__(self):
        return str(self.date) + " " + self.name.name + "(" + self.lexicon.lexiconName + ")"

    class Meta:
        unique_together = ("name", "lexicon", "date")   
        # there can only be ONE challenge with a specific name, lexicon, and date


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
    qualifyForAward = models.BooleanField(default=True) # only qualify for award if entry is in allowable range
    additionalData = models.TextField(null=True) # awards, anything else?
    def __unicode__(self):
        return (self.board.challenge.__unicode__() + ' --- ' + 
                        self.user.username + ' ' + str(self.score) + ' (' + str(self.timeRemaining) + 's.)')

    class Meta:
        unique_together = ("board", "user") 
        # there is only one leaderboard per challenge, and only one user/leaderboard combination 
        # allowed in the leaderboard entries

    # in Word
    # alphagram = models.ForeignKey(Alphagram)
    # a word just has one alphagram, but an alphagram can 'have' multiple words

class SavedList(models.Model):
    lexicon = models.ForeignKey(Lexicon)
    created = models.DateTimeField(auto_now_add=True)
    lastSaved = models.DateTimeField(auto_now=True, auto_now_add=True)
    name = models.CharField(max_length=50)
    user = models.ForeignKey(User)
    
    numAlphagrams = models.IntegerField()
    numCurAlphagrams = models.IntegerField()
    numFirstMissed = models.IntegerField()
    numMissed = models.IntegerField()
    goneThruOnce = models.BooleanField()
    questionIndex = models.IntegerField()
    
    origQuestions = models.TextField()
    curQuestions = models.TextField()
    missed = models.TextField()
    firstMissed = models.TextField()
    
    def __unicode__(self):
        return '(' + self.lexicon.lexiconName + ') ' + self.name + (' *' if self.goneThruOnce else ' ') + '(Saved ' + str(self.lastSaved) +')'
    # todo keep track of original alphagrams even in regular list, so it can be saved separately..


class WordwallsGameModel(GenericTableGameModel, LockableObject):
    # additional fields
    numOrigQuestions = models.IntegerField()
    origQuestions = models.TextField()

    numCurQuestions = models.IntegerField()
    curQuestions = models.TextField()

    numMissed = models.IntegerField()
    missed = models.TextField()

    numFirstMissed = models.IntegerField()
    firstMissed = models.TextField()

class DailyChallengeMissedBingos(models.Model): # only tracks missed 7&8 letter words from daily challenges
    challenge = models.ForeignKey(DailyChallenge)
    alphagram = models.ForeignKey(Alphagram)
    numTimesMissed = models.IntegerField()
    
    class Meta:
        unique_together = ("challenge", "alphagram")
    
    def __unicode__(self):
        return self.challenge.__unicode__() + ", " + self.alphagram.alphagram + ", " + str(self.numTimesMissed)
        
class NamedList(models.Model):
    lexicon = models.ForeignKey(Lexicon)
    name = models.CharField(max_length=50, default='')
    numQuestions = models.IntegerField()
    wordLength = models.IntegerField()
    isRange = models.BooleanField() # is a range of alphagram pk indices, or if False it is a list of indices
    questions = models.TextField(default='')  # json string