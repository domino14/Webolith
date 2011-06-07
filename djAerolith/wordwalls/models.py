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
    name = models.CharField(max_length=32)
    def __unicode__(self):
        return self.name

class DailyChallenge(models.Model):
    lexicon = models.ForeignKey(Lexicon)
    date = models.DateField(auto_now_add=True)  # set the date to now when an instance is created
    name = models.ForeignKey(DailyChallengeName)
    alphagrams = models.TextField()
    seconds = models.IntegerField() # the number of seconds alloted for this challenge
    def __unicode__(self):
        return str(self.date) + " " + self.name.name + "(" + self.lexicon.lexiconName + ")"


class DailyChallengeLeaderboard(models.Model):
    challenge = models.ForeignKey(DailyChallenge) 
    maxScore = models.IntegerField()
    def __unicode__(self):
        return "Leaderboard: " + self.challenge.__unicode__()

class DailyChallengeLeaderboardEntry(models.Model):
    board = models.ForeignKey(DailyChallengeLeaderboard)
    user = models.ForeignKey(User)
    score = models.IntegerField()
    timeRemaining = models.IntegerField()
    def __unicode__(self):
        return (self.board.challenge.__unicode__() + ' --- ' + 
                        self.user.username + ' ' + str(self.score) + ' (' + str(self.timeRemaining) + 's.)')

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

class WordwallsGameModel(GenericTableGameModel):
    # additional fields
    numOrigQuestions = models.IntegerField()
    origQuestions = models.TextField()
    
    numCurQuestions = models.IntegerField()
    curQuestions = models.TextField()
    
    numMissed = models.IntegerField()
    missed = models.TextField()
    
    numFirstMissed = models.IntegerField()
    firstMissed = models.TextField()