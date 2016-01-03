"""
Migrate saved lists.

"""

import logging
import json

from django.core.management.base import BaseCommand
from django.db import connection

from base.models import WordList
from base.migration_utils import migrate_alphagrams

logger = logging.getLogger(__name__)

FETCH_MANY_SIZE = 1000


class Command(BaseCommand):
    def handle(self, *args, **options):
        unmigrated_lists = WordList.objects.exclude(version=2)
        word_list_count = unmigrated_lists.count()
        logger.debug('Number of word lists: %s', word_list_count)
        logger.debug('Of these, %s are temporary',
                     unmigrated_lists.filter(is_temporary=True).count())
        idx = 0
        cursor = connection.cursor()
        for word_list in unmigrated_lists:
            idx += 1
            if idx % 1000 == 0:
                print idx, "..."
            questions = json.loads(word_list.origQuestions)
            question_struct = migrate_alphagrams(questions, cursor)
            word_list.origQuestions = json.dumps(question_struct)
            word_list.version = 2
            word_list.full_clean()
            word_list.save()
