"""
Test the migration function for word lists.

"""
import json
import logging

from django.test import TestCase
from django.db import connection

from wordwalls.tests.mixins import WordListAssertMixin
from base.migration_utils import migrate_alphagrams
from base.models import WordList

logger = logging.getLogger(__name__)


class WordwallsListMigrationTest(TestCase, WordListAssertMixin):
    fixtures = ['test/lexica.json',
                'test/users.json',
                'test/words.json',
                'test/alphagrams.json',
                'test/profiles.json',
                'test/word_lists_v1.json']

    def test_migrate_alphagrams(self):
        cursor = connection.cursor()
        for word_list in WordList.objects.all():
            questions = json.loads(word_list.origQuestions)
            question_struct = migrate_alphagrams(questions, cursor)
            word_list.origQuestions = json.dumps(question_struct)
            word_list.version = 2
            logger.debug('Migrated word list %s, new qs %s', word_list,
                         question_struct)
            word_list.full_clean()
            word_list.save()
            self.assert_wl(word_list, {
                'version': 2, 'is_temporary': False})
