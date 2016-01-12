"""
Migrate daily challenges and daily challenge missed bingos.

"""

import logging
import json

from django.core.management.base import BaseCommand
from django.db import connection

from wordwalls.models import DailyChallenge, DailyChallengeMissedBingos
from base.migration_utils import migrate_alphagrams
logger = logging.getLogger(__name__)


class Command(BaseCommand):
    def handle(self, *args, **options):
        dc_count = DailyChallenge.objects.count()
        logger.debug('Number of daily challenges: %s', dc_count)
        idx = 0
        cursor = connection.cursor()
        for challenge in DailyChallenge.objects.all():
            idx += 1
            if idx % 1000 == 0:
                print idx, "..."
            questions = json.loads(challenge.alphagrams)
            question_struct = migrate_alphagrams(questions, cursor)
            challenge.alphagrams = json.dumps(question_struct)
            challenge.save()

        mb_count = DailyChallengeMissedBingos.objects.count()
        logger.debug('Number of missed bingos: %s', mb_count)
        idx = 0
        for mb in DailyChallengeMissedBingos.objects.all():
            idx += 1
            if idx % 1000 == 0:
                print idx, "..."
            if mb.alphagram_string == '':
                mb.alphagram_string = mb.alphagram.alphagram
                mb.save()
