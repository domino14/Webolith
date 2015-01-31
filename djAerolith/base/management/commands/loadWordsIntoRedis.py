import redis
from django.core.management.base import BaseCommand
from django.conf import settings
from django.db import connection
import json

# Only use the following lexica:
INCLUDE_LEX = [4, 6]        # 4 - OWL2, 6 - CSW12
FETCH_MANY_SIZE = 1000


class Command(BaseCommand):
    def handle(self, *args, **options):
        # Deal with raw db query rather than the ORM as it's much slower.
        # First, get all alphagrams.
        cursor = connection.cursor()
        r = redis.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT,
                        db=settings.REDIS_ALPHAGRAMS_DB)

        cursor.execute(
            'SELECT alphagram, lexicon_id, probability_pk FROM '
            'base_alphagram WHERE lexicon_id IN %s' % str(tuple(INCLUDE_LEX)))

        rows = cursor.fetchmany(FETCH_MANY_SIZE)
        pipe = r.pipeline(transaction=False)
        rowCounter = 0
        while rows:
            for row in rows:
                key = '%s:%s' % (row[0], row[1])
                value = row[2]
                pipe.set(key, value)
                rowCounter += 1
                if rowCounter % 10000 == 0:
                    print ('%s .' % rowCounter),
                    pipe.execute()
                    pipe = r.pipeline()
            rows = cursor.fetchmany(FETCH_MANY_SIZE)
        print
        pipe.execute()
        print 'Executing words query'
        # Now store all words.
        cursor.execute(
            'SELECT word, alphagram_id, lexiconSymbols, definition, '
            'front_hooks, back_hooks, base_alphagram.alphagram, '
            'base_alphagram.probability FROM '
            'base_word INNER JOIN '
            'base_alphagram ON '
            'base_word.alphagram_id = base_alphagram.probability_pk WHERE '
            'base_word.lexicon_id in %s' % str(tuple(INCLUDE_LEX)))
        rows = cursor.fetchmany(FETCH_MANY_SIZE)
        r = redis.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT,
                        db=settings.REDIS_ALPHAGRAM_SOLUTIONS_DB)
        pipe = r.pipeline()
        rowCounter = 0
        seen_alphas = set()
        while rows:
            for row in rows:
                obj = {
                    'word': row[0],
                    'symbols': row[2],
                    'def': row[3],
                    'f_hooks': row[4],
                    'b_hooks': row[5]
                }
                key = '%s' % row[1]  # Index by the alphagram id
                if key not in seen_alphas:
                    pipe.delete(key)  # Delete the list and start over.
                    pipe.rpush(key, json.dumps({
                        'question': row[6],
                        'probability': row[7]
                    }))
                seen_alphas.add(key)
                pipe.rpush(key, json.dumps(obj))
                rowCounter += 1
                if rowCounter % 1000 == 0:
                    print ('%s .' % rowCounter),
                    pipe.execute()
                    pipe = r.pipeline()
            rows = cursor.fetchmany(FETCH_MANY_SIZE)
        print
        pipe.execute()

