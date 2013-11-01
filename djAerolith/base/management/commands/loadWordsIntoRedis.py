import redis
from django.core.management.base import BaseCommand, CommandError
from base.models import Lexicon, Word, Alphagram
import csv
from django.conf import settings
from django.db import connection
import json

# Only use the following lexica:
INCLUDE_LEX = [4, 6]        # 4 - OWL2, 6 - CSW12


class Command(BaseCommand):
    def handle(self, *args, **options):
        # Deal with raw db query rather than the ORM as it's much slower.
        # First, get all alphagrams.
        cursor = connection.cursor()
        r = redis.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT,
                        db=0)

        cursor.execute(
            'SELECT alphagram, lexicon_id, probability_pk FROM '
            'base_alphagram WHERE lexicon_id IN %s' % str(tuple(INCLUDE_LEX)))
        print 'Got all alphagrams, feeding into Redis...'
        rows = cursor.fetchall()
        pipe = r.pipeline(transaction=False)
        rowCounter = 0
        for row in rows:
            key = '%s:%s' % (row[0], row[1])
            value = row[2]
            pipe.set(key, value)
            rowCounter += 1
            if rowCounter % 10000 == 0:
                print ('%s .' % rowCounter),
                pipe.execute()
                pipe = r.pipeline()
        print
        pipe.execute()

        # Now store all words.
        cursor.execute(
            'SELECT word, alphagram_id, lexiconSymbols, '
            'definition, front_hooks, back_hooks FROM base_word WHERE '
            'lexicon_id in %s' % str(tuple(INCLUDE_LEX)))
        print 'Got all words, feeding into redis...'
        # Temporarily consume a bunch of memory?
        rows = cursor.fetchall()
        r = redis.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT,
                        db=1)
        pipe = r.pipeline()
        rowCounter = 0
        seen_alphas = set()
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
            seen_alphas.add(key)
            pipe.rpush(key, json.dumps(obj))
            rowCounter += 1
            if rowCounter % 10000 == 0:
                print ('%s .' % rowCounter),
                pipe.execute()
                pipe = r.pipeline()
        pipe.execute()