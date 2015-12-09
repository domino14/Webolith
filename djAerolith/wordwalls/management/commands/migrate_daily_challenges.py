"""
Migrate daily challenges and daily challenge missed bingos.

"""

import logging
import json

from django.core.management.base import BaseCommand
from django.db import connection

from wordwalls.models import DailyChallenge, DailyChallengeMissedBingos
from wordwalls.game import WordwallsGame

logger = logging.getLogger(__name__)

FETCH_MANY_SIZE = 1000


class Command(BaseCommand):
    def migrate_alphagrams(self, questions, cursor, lexicon, challenge_id):
        """ Migrate the list of questions to alphagrams. """
        question_ret = []
        if len(questions) not in (50, 100):
            logger.debug('Possibly corrupted challenge: %s %s', challenge_id,
                         len(questions))
            return question_ret
        if type(questions[0]) is int:
            # I don't care that I'm interpolating the string directly
            # here, I know these are all alphagrams and valid values.
            cursor.execute(
                """
                SELECT word, base_alphagram.alphagram FROM base_word
                INNER JOIN base_alphagram ON base_word.alphagram_id =
                base_alphagram.probability_pk
                WHERE base_alphagram.probability_pk in %s
                """ % str(tuple(questions))
            )
            rows = cursor.fetchmany(FETCH_MANY_SIZE)
            last_question = None
            while rows:
                for row in rows:
                    if row[1] != last_question:
                        obj = {'q': row[1], 'a': [row[0]]}
                        question_ret.append(obj)
                    else:
                        question_ret[-1]['a'].append(row[0])
                    last_question = row[1]

                rows = cursor.fetchmany(FETCH_MANY_SIZE)

        elif type(questions[0]) is dict:
            answers = {}
            word_pks = []
            for q in questions:
                for a in q['a']:
                    word_pks.append(a)
            cursor.execute("""
                SELECT word, id FROM base_word WHERE base_word.id IN %s """ %
                           str(tuple(word_pks)))
            rows = cursor.fetchmany(FETCH_MANY_SIZE)
            while rows:
                for row in rows:
                    answers[row[1]] = row[0]
                rows = cursor.fetchmany(FETCH_MANY_SIZE)

            for q in questions:
                question_ret.append({
                    'q': q['q'],
                    'a': [answers[a_idx] for a_idx in q['a']]
                })
        assert (
            len(question_ret) == len(questions),
            "Didn't match: %s, %s, %s, %s" % (
                len(question_ret), len(questions), question_ret, questions))
        return question_ret

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
            question_struct = self.migrate_alphagrams(questions, cursor,
                                                      challenge.lexicon,
                                                      challenge.pk)
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
