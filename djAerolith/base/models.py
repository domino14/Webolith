#!/usr/bin/python
# -*- coding: utf-8 -*-
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

from django.utils import timezone
from django.db import models
from django.contrib.auth.models import User

from base.validators import word_list_format_validator
from lib.dates import pretty_date

EXCLUDED_LEXICA = [
    'OWL2',
    'CSW07',
    'CSW12',
    'America2016',
]

# XXX: This handles both the Spanish and English case, but alphagrammize
# will need to be reworked with lexicon-specific ordering if we add
# non-latin letters.
SORT_STRING_ORDER = u'ABC1DEFGHIJKL2MNÑOPQR3STUVWXYZ?'
SORT_MAP = {}


def make_sort_map():
    global SORT_MAP
    for idx, val in enumerate(SORT_STRING_ORDER):
        SORT_MAP[val] = idx


def alphagrammize(word):
    if len(SORT_MAP) == 0:
        make_sort_map()
    l = list(word.upper())
    l.sort(key=lambda y: SORT_MAP[y])
    return string.join(l, '')


class Maintenance(models.Model):
    info = models.CharField(max_length=1024)
    show = models.BooleanField(default=False)


class Lexicon(models.Model):
    lexiconName = models.CharField(max_length=12)
    # user-friendly description
    lexiconDescription = models.CharField(max_length=64)
    # alphagrams per word length
    lengthCounts = models.CharField(max_length=256)

    def __unicode__(self):
        return self.lexiconName


class SavedList(models.Model):
    CATEGORY_ANAGRAM = 'A'      # Regular word walls
    CATEGORY_BUILD = 'B'        # Subwords
    CATEGORY_THROUGH_TILES = 'T'

    LIST_CATEGORIES = (
        (CATEGORY_ANAGRAM, 'Anagram'),
        (CATEGORY_BUILD, 'Build'),
        (CATEGORY_THROUGH_TILES, 'Through')
    )

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
    version = models.IntegerField(default=2)
    category = models.CharField(choices=LIST_CATEGORIES, max_length=2,
                                default=CATEGORY_ANAGRAM)

    def initialize_list(self, questions, lexicon, user, shuffle=False,
                        keep_old_name=False, save=True,
                        category=CATEGORY_ANAGRAM):
        """
        Initialize a list with the passed in questions. Optionally saves
        it to the database.

        questions - A list of {'q': 'abc', 'a': [...]} objects.
        lexicon - The lexicon.
        user - The user. If save is False, this value is ignored.
        shuffle - Whether to shuffle the questions.
        keep_old_name - If False, generate a new name and set as a
            temporary word list.
        save - Save the word list to the database. If this is False,
            we can just use this as an object that we can dump to JSON.
            This is used for the API in base/views.py.

        """
        num_questions = len(questions)
        if shuffle:
            random.shuffle(questions)
        self.lexicon = lexicon
        if not keep_old_name:
            self.name = uuid.uuid4().hex
            self.is_temporary = True
        self.numAlphagrams = num_questions
        self.numCurAlphagrams = num_questions
        self.numFirstMissed = 0
        self.numMissed = 0
        self.goneThruOnce = False
        self.questionIndex = 0
        self.origQuestions = json.dumps(questions)
        self.curQuestions = json.dumps(range(num_questions))
        self.missed = json.dumps([])
        self.firstMissed = json.dumps([])
        self.version = 2
        self.category = category
        if save:
            self.user = user
            self.save()

    def make_temporary_copy(self):
        """
        Make a temporary copy of this word list. This is useful for
        multiplayer mode.

        """
        wl = WordList(
            lexicon=self.lexicon,
            name=uuid.uuid4().hex,
            user=self.user,
            is_temporary=True,
            numAlphagrams=self.numAlphagrams,
            numCurAlphagrams=self.numCurAlphagrams,
            numFirstMissed=self.numFirstMissed,
            numMissed=self.numMissed,
            goneThruOnce=self.goneThruOnce,
            questionIndex=self.questionIndex,
            origQuestions=self.origQuestions,
            curQuestions=self.curQuestions,
            missed=self.missed,
            firstMissed=self.firstMissed,
            version=self.version,
            category=self.category)
        return wl

    def restart_list(self, shuffle=False):
        """ Restart this list; save it back to the database. """
        self.initialize_list(json.loads(self.origQuestions),
                             self.lexicon, self.user, shuffle,
                             keep_old_name=True, category=self.category)

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
            'temporary': self.is_temporary,
            'category': self.category,
        }

    def date_to_str(self, dt, human):
        if not human:
            return dt.strftime('%Y-%m-%d %H:%M')
        return pretty_date(timezone.localtime(timezone.now()), dt)

    def to_python_reduced(self, last_saved_human=False):
        """
        Converts to a Python object, but this is a reduced form. This
        should be used for "get_all" type responses.

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
            'version': self.version,
            # Note: This time is given in the Django installation's local
            # time (which happens to be Los Angeles). It is probably better
            # to make the local time UTC, and then do the transformation
            # client side. In this case, we'll have to transform the
            # time client side from Los Angeles time >.<
            # XXX: We should turn on time zone support, etc.
            'lastSaved': self.date_to_str(self.lastSaved, last_saved_human),
            'lastSavedDT': self.date_to_str(self.lastSaved, False),
            'id': self.pk,
            'temporary': self.is_temporary,
            'category': self.category,
        }

    def __unicode__(self):
        return "(%s) %s%s (Saved %s)" % (
            self.lexicon.lexiconName,
            self.name,
            '*' if self.goneThruOnce else '',
            self.lastSaved)

    class Meta:
        # XXX: Unfortunately, changing this table name, and not just
        # moving to "WordList" will be tricky. Table names have to be
        # changed everywhere, including tests, etc...
        db_table = 'wordwalls_savedlist'
        unique_together = ('lexicon', 'name', 'user')


class WordList(SavedList):
    # XXX: we are using this instead of the badly-named "SavedList"
    # in all of our code. These names should be interchangeable.
    class Meta:
        proxy = True


class AlphagramTag(models.Model):
    WORD_TAGS = (
        ('D5', 'Very Easy'),
        ('D4', 'Easy'),
        ('D3', 'Average'),
        ('D2', 'Hard'),
        ('D1', 'Very Hard'),
    )
    user = models.ForeignKey(User)
    lexicon = models.ForeignKey(Lexicon)
    alphagram = models.CharField(max_length=15)
    tag = models.CharField(choices=WORD_TAGS, max_length=2)

    class Meta:
        unique_together = ('user', 'lexicon', 'alphagram')
