import redis
from django.core.management.base import BaseCommand, CommandError
from base.models import Lexicon, Word, Alphagram
import csv
from django.conf import settings

class Command(BaseCommand):
    def handle(self, *args, **options):
        r = redis.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, db=0)
        alphs_file = '/Users/cesar/coding/webolith/dbCreator-build-desktop/alphs.txt'
        alphReader = csv.reader(open(alphs_file, 'rb'))
        
        pipe = r.pipeline(transaction=False)
        rowCounter = 0
        for row in alphReader:
            key = row[0] + ':' + row[1]
            value = row[3]
            pipe.set(key, value)
            rowCounter += 1
            if rowCounter % 10000 == 0:
                pipe.execute()
                pipe = r.pipeline(transaction=False)
        
        pipe.execute()