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

import string
import random
import json
import uuid

from django.db import models
from django.contrib.auth.models import User

from base.validators import word_list_format_validator
EXCLUDED_LEXICA = ['OWL2', 'CSW07', 'CSW12']


def alphProbToProbPK(prob, lexId, length):
    # XXX: THIS ONLY ALLOWS FOR LEXICON INDICES FROM 0 to 3
    # (Terrible oversight)
    # Everything else may result in weird collisions. This needs to be
    # reworked!!
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
    lastSaved = models.DateTimeField(auto_now=True)
    name = models.CharField(max_length=50)
    user = models.ForeignKey(User)

    numAlphagrams = models.IntegerField()
    numCurAlphagrams = models.IntegerField()
    numFirstMissed = models.IntegerField()
    numMissed = models.IntegerField()
    goneThruOnce = models.BooleanField()
    questionIndex = models.IntegerField()

    origQuestions = models.TextField(validators=[word_list_format_validator])
    curQuestions = models.TextField()
    missed = models.TextField()
    firstMissed = models.TextField()
    # If this word list is temporary, it should be cleaned up when its
    # parent (the game table) gets deleted.
    # This defaults to False for compatibility with prior rows, but
    # in initialize_list we should set it to True. The only function
    # that should set it back to False is a save.
    is_temporary = models.BooleanField(default=False)
    # XXX: Change default to 2 after migration.
    version = models.IntegerField(default=1)

    def initialize_list(self, alphagrams, lexicon, user, shuffle=False,
                        keep_old_name=False):
        """
        Initialize a list with the passed in alphagrams. Saves it back
        to the database.

        """
        num_questions = len(alphagrams)
        if shuffle:
            random.shuffle(alphagrams)
        self.lexicon = lexicon
        if not keep_old_name:
            self.name = uuid.uuid4().hex
            self.is_temporary = True
        self.user = user
        self.numAlphagrams = num_questions
        self.numCurAlphagrams = num_questions
        self.numFirstMissed = 0
        self.numMissed = 0
        self.goneThruOnce = False
        self.questionIndex = 0
        self.origQuestions = json.dumps(alphagrams)
        self.curQuestions = json.dumps(range(num_questions))
        self.missed = json.dumps([])
        self.firstMissed = json.dumps([])
        self.version = 2
        self.save()

    def restart_list(self, shuffle=False):
        """ Restart this list; save it back to the database. """
        self.initialize_list(json.loads(self.origQuestions),
                             self.lexicon, self.user, shuffle,
                             keep_old_name=True)

    def set_to_first_missed(self):
        """ Set this list to quiz on first missed questions; save. """
        self.curQuestions = self.firstMissed
        self.numCurAlphagrams = self.numFirstMissed
        self.questionIndex = 0
        self.missed = json.dumps([])
        self.numMissed = 0
        self.save()

    def set_to_missed(self):
        """ Set this list to start quizzing on the missed questions; save. """
        self.curQuestions = self.missed
        self.numCurAlphagrams = self.numMissed
        self.questionIndex = 0
        self.missed = json.dumps([])
        self.numMissed = 0
        self.save()

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
            'version': self.version,
            'id': self.pk,
            'temporary': self.is_temporary
        }

    def __unicode__(self):
        return "(%s) %s%s (Saved %s)" % (
            self.lexicon.lexiconName,
            self.name,
            '*' if self.goneThruOnce else '',
            self.lastSaved)

    class Meta:
        # XXX: This will be removed once we move over to Postgres or
        # something. We should rename this database table properly
        # (or even do it prior to that).
        db_table = 'wordwalls_savedlist'
        unique_together = ('lexicon', 'name', 'user')


class WordList(SavedList):
    # XXX: we are using this instead of the badly-named "SavedList"
    # in all of our code. These names should be interchangeable.
    class Meta:
        proxy = True
