"""
Test file upload and list creation.

"""

import os
import logging
import gzip

from django.test import TestCase
from django.conf import settings
from django.contrib.auth.models import User
from django.db import connection
from unittest import skip

from base.models import Lexicon, WordList
from wordwalls.views import create_user_list
from wordwalls.tests.mixins import WordListAssertMixin

logger = logging.getLogger(__name__)


# XXX We should also test the views themselves, which do some UTF8
# manipulation. (ajax_upload particularly)
class FileUploadTestCase(TestCase, WordListAssertMixin):
    fixtures = [
        "test/lexica.yaml",
        "test/users.json",
        "test/profiles.json",
        "test/word_lists.json",
    ]

    def setUp(self):
        # Reset sequence so that we don't get integrity errors.
        # Resetting it to a high number (higher than the PKs of the word list).
        # XXX XXX XXX
        # Why do I have to do this? Why doesn't Django do this by default,
        # or at least warn me in the docs, or have some method to do this?
        # It's so weird, am I missing something?
        cursor = connection.cursor()
        cursor.execute(
            "select setval('%s_id_seq', %d, True)" % ("wordwalls_savedlist", 123456)
        )

    def test_create_list(self):
        filename = "new_america_jqxz_6s.txt"
        path = os.path.join(settings.BASE_DIR, "wordwalls", "tests", "files", filename)
        user = User.objects.get(username="cesar")
        with open(path, "r") as f:
            contents = f.read()
        create_user_list(
            contents, filename, Lexicon.objects.get(lexiconName="NWL18"), user
        )
        wl = WordList.objects.get(name="new_america_jqxz_6s")
        # there's 87 words/alphagrams in the list but they deleted CAZHER in
        # 2018 so there's only 86 now.
        self.assert_wl(
            wl,
            {
                "numAlphagrams": 86,
                "numCurAlphagrams": 86,
                "numFirstMissed": 0,
                "numMissed": 0,
                "goneThruOnce": False,
                "questionIndex": 0,
                "is_temporary": False,
            },
        )

        # Check that it added to total. 55781 is the old value, in
        # profiles.json
        self.assertEqual(user.aerolithprofile.wordwallsSaveListSize, 55781 + 86)
        f.close()

    def test_create_giant_list(self):
        filename = "america_9s.txt.gz"
        path = os.path.join(settings.BASE_DIR, "wordwalls", "tests", "files", filename)
        user = User.objects.get(username="cesar")
        with gzip.open(path, "rt") as f:
            contents = f.read()
        create_user_list(
            contents, "america_9s.txt", Lexicon.objects.get(lexiconName="NWL18"), user
        )
        wl = WordList.objects.get(name="america_9s")
        self.assert_wl(
            wl,
            {
                "numAlphagrams": 28291,
                "numCurAlphagrams": 28291,
                "numFirstMissed": 0,
                "numMissed": 0,
                "goneThruOnce": False,
                "questionIndex": 0,
                "is_temporary": False,
            },
        )

        # Check that it added to total. 55781 is the old value, in
        # profiles.json
        self.assertEqual(user.aerolithprofile.wordwallsSaveListSize, 55781 + 28291)

    @skip("Skip until we fix spanish digraph handling properly")
    def test_create_spanish_list(self):
        filename = "spanish_words.txt"
        path = os.path.join(settings.BASE_DIR, "wordwalls", "tests", "files", filename)
        user = User.objects.get(username="cesar")
        with open(path, "r") as f:
            contents = f.read()
        create_user_list(
            contents, filename, Lexicon.objects.get(lexiconName="FISE2"), user
        )
        wl = WordList.objects.get(name="spanish_words")
        self.assert_wl(
            wl,
            {
                "numAlphagrams": 3,
                "numCurAlphagrams": 3,
                "numFirstMissed": 0,
                "numMissed": 0,
                "goneThruOnce": False,
                "questionIndex": 0,
                "is_temporary": False,
            },
        )

        # Check that it added to total. 55781 is the old value, in
        # profiles.json
        self.assertEqual(user.aerolithprofile.wordwallsSaveListSize, 55781 + 3)
        f.close()
