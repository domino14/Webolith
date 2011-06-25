from django.core.management.base import BaseCommand, CommandError
from wordwalls.models import DailyChallenge, DailyChallengeName, DailyChallengeMissedBingos
from datetime import date, timedelta
from base.models import Lexicon
import random
import time
class Command(BaseCommand):
    help = """Generates challenge pks with toughie bingos; this is more of a debug command and is not intended to be run in production
                needs a lexicon"""

    def handle(self, *args, **options):
        if len(args)!= 1:
            raise CommandError("Must have a lexicon name argument")
        try:
            lex = Lexicon.objects.get(lexiconName=args[0])
        except:
            raise CommandError("That lexicon does not exist!")
        t1 = time.time()
        datenow = date.today()
        diff = datenow.isoweekday() - DailyChallengeName.WEEKS_BINGO_TOUGHIES_ISOWEEKDAY
        if diff < 0:
            diff = 7-diff
        
        chDate = datenow - timedelta(days=diff)
        minDate = chDate - timedelta(days=7)
        maxDate = chDate - timedelta(days=1)
        print "minDate", minDate, "maxDate", maxDate
        dc7s = DailyChallengeName.objects.get(name="Today's 7s")
        dc8s = DailyChallengeName.objects.get(name="Today's 8s")
        
        dc7sQSet = DailyChallenge.objects.filter(lexicon=lex).filter(date__range=(minDate, maxDate)).filter(name=dc7s)
        dc8sQSet = DailyChallenge.objects.filter(lexicon=lex).filter(date__range=(minDate, maxDate)).filter(name=dc8s)
        # now find all the missed alphagrams for these dcs and sort them by number of times missed                
        mbingos7 = DailyChallengeMissedBingos.objects.filter(challenge__in=list(dc7sQSet)).order_by('-numTimesMissed')[:25]
        mbingos8 = DailyChallengeMissedBingos.objects.filter(challenge__in=list(dc8sQSet)).order_by('-numTimesMissed')[:25]

        pks = [a.alphagram.pk for a in mbingos7]
        pks.extend([a.alphagram.pk for a in mbingos8])
        random.shuffle(pks)
        
        print "time to gen", time.time() - t1
        print pks
