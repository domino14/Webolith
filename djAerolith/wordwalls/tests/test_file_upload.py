"""
Test file upload and list creation.

"""

import os
import logging
import gzip
import codecs

from django.test import TestCase
from django.conf import settings
from django.contrib.auth.models import User

from wordwalls.views import create_user_list
from base.models import Lexicon, WordList
from wordwalls.tests.mixins import WordListAssertMixin

logger = logging.getLogger(__name__)


class FileUploadTestCase(TestCase, WordListAssertMixin):
    fixtures = ['test/lexica.json',
                'test/users.json',
                'test/profiles.json',
                'test/word_lists.json']

    def test_create_list(self):
        filename = 'new_america_jqxz_6s.txt'
        path = os.path.join(settings.PROJECT_ROOT, 'wordwalls', 'tests',
                            'files', filename)
        user = User.objects.get(username='cesar')
        f = open(path, 'r')
        contents = f.read()
        f.close()
        logger.debug(create_user_list(
            contents, filename,
            Lexicon.objects.get(lexiconName='America'), user))
        logger.debug(WordList.objects.all())
        wl = WordList.objects.get(name='new_america_jqxz_6s')
        self.assert_wl(wl, {
            'numAlphagrams': 87, 'numCurAlphagrams': 87, 'numFirstMissed': 0,
            'numMissed': 0, 'goneThruOnce': False, 'questionIndex': 0,
            'is_temporary': False
        })

        # Check that it added to total. 55781 is the old value, in
        # profiles.json
        self.assertEqual(user.aerolithprofile.wordwallsSaveListSize,
                         55781 + 87)
        f.close()

    def test_create_giant_list(self):
        filename = 'america_9s.txt.gz'
        path = os.path.join(settings.PROJECT_ROOT, 'wordwalls', 'tests',
                            'files', filename)
        user = User.objects.get(username='cesar')
        with gzip.open(path, 'rb') as f:
            contents = f.read()
        create_user_list(contents, 'america_9s.txt',
                         Lexicon.objects.get(lexiconName='America'), user)
        logger.debug(WordList.objects.all())
        wl = WordList.objects.get(name='america_9s')
        self.assert_wl(wl, {
            'numAlphagrams': 28291, 'numCurAlphagrams': 28291,
            'numFirstMissed': 0, 'numMissed': 0, 'goneThruOnce': False,
            'questionIndex': 0, 'is_temporary': False
        })

        # Check that it added to total. 55781 is the old value, in
        # profiles.json
        self.assertEqual(user.aerolithprofile.wordwallsSaveListSize,
                         55781 + 28291)

    def test_create_spanish_list(self):
        filename = 'spanish_words.txt'
        path = os.path.join(settings.PROJECT_ROOT, 'wordwalls', 'tests',
                            'files', filename)
        user = User.objects.get(username='cesar')
        f = codecs.open(path, 'r', 'utf-8')
        contents = f.read()
        f.close()
        logger.debug(create_user_list(
            contents, filename,
            Lexicon.objects.get(lexiconName='FISE09'), user))
        logger.debug(WordList.objects.all())
        wl = WordList.objects.get(name='spanish_words')
        self.assert_wl(wl, {
            'numAlphagrams': 3, 'numCurAlphagrams': 3, 'numFirstMissed': 0,
            'numMissed': 0, 'goneThruOnce': False, 'questionIndex': 0,
            'is_temporary': False
        })

        # Check that it added to total. 55781 is the old value, in
        # profiles.json
        self.assertEqual(user.aerolithprofile.wordwallsSaveListSize,
                         55781 + 3)
        f.close()
