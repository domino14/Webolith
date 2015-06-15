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
import string
import json


def alphProbToProbPK(prob, lexId, length):
    return prob + (lexId << 24) + (length << 26)


def probPKToAlphProb(probPk):
    if probPk:
        return probPk & ((1 << 24) - 1)
    return None


def alphagrammize(word):
    # Replace blank with something lexically bigger than the largest letter.
    # This seems like a hack.
    word = word.replace('?', chr(128))
    l = list(word)
    l.sort()
    return string.join(l, '').upper().replace(chr(128), '?')


class Lexicon(models.Model):
    lexiconName = models.CharField(max_length=12)
    # user-friendly description
    lexiconDescription = models.CharField(max_length=64)
    # alphagrams per word length
    lengthCounts = models.CharField(max_length=256)

    def __unicode__(self):
        return self.lexiconName

# see http://docs.djangoproject.com/en/1.2/topics/serialization/ for
# manager stuff:


class AlphagramManager(models.Manager):
    def get_by_natural_key(self, alphagram, lexicon):
        return self.get(alphagram=alphagram, lexicon=lexicon)


class Alphagram(models.Model):
    objects = AlphagramManager()

    alphagram = models.CharField(max_length=15, db_index=True)
    lexicon = models.ForeignKey(Lexicon)
    probability = models.IntegerField()
    probability_pk = models.IntegerField(primary_key=True)
    length = models.IntegerField()

    def __unicode__(self):
        return self.alphagram

    def natural_key(self):
        return (self.alphagram, self.lexicon)

    class Meta:
        unique_together = (('alphagram', 'lexicon'),
                           ('probability', 'length', 'lexicon')
                           )


class Word(models.Model):
    word = models.CharField(max_length=15, db_index=True)
    alphagram = models.ForeignKey(Alphagram)
    lexicon = models.ForeignKey(Lexicon)
    lexiconSymbols = models.CharField(max_length=5)
    # A word can only have one lexicon, even though e.g. 'PAN' could be
    # in multiple lexica (csw, owl2, fise, etc). This makes it much
    # simpler to keep the lexicon-specific definition, front hooks, back
    # hooks, etc. in this table and it makes more sense (see notes
    # below)
    definition = models.CharField(max_length=512)
    front_hooks = models.CharField(max_length=26)
    back_hooks = models.CharField(max_length=26)
    inner_front_hook = models.BooleanField(default=False)
    inner_back_hook = models.BooleanField(default=False)

    def __unicode__(self):
        return self.word + ": " + self.definition

# these models for words allow for separating words from alphagrams from
# lexica however let's not make it too confusing -- we should stick to
# creating a new word for each lexicon even if it already exists in
# Word. This is because words can mean different things (think Spanish
# lexicon, PAN for example)

# a definitions model wouldn't be right, because although 'words' can
# have different definitions depending on lexica, they're not the same
# 'words' i.e. PAN in spanish and english are spelled the same but they
# are pronounced differently and mean different things, so they are not
# the same word; it makes sense to repeat an entry for PAN in the Word
# database for the different lexica.

############################


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

    def to_python(self):
        """
            Converts to a serializable Python object.
        """
        return {
            'lexicon': self.lexicon.lexiconName,
            'name': self.name,
            'numAlphagrams': self.numAlphagrams,
            'numCurAlphagrams': self.numCurAlphagrams,
            'numFirstMissed': self.numFirstMissed,
            'numMissed': self.numMissed,
            'goneThruOnce': self.goneThruOnce,
            'questionIndex': self.questionIndex,
            'origQuestions': json.loads(self.origQuestions),
            'curQuestions': json.loads(self.curQuestions),
            'missed': json.loads(self.missed),
            'firstMissed': json.loads(self.firstMissed),
            'id': self.pk
        }

    def __unicode__(self):
        return "(%s) %s%s (Saved %s)" % (
            self.lexicon.lexiconName,
            self.name,
            '*' if self.goneThruOnce else '',
            self.lastSaved)
    # TODO keep track of original alphagrams even in regular list, so it
    # can be saved separately..

    class Meta:
        db_table = 'wordwalls_savedlist'
