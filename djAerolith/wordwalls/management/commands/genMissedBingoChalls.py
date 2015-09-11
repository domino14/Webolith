from django.core.management.base import BaseCommand, CommandError
from wordwalls.models import (DailyChallenge,
                              DailyChallengeName,
                              DailyChallengeMissedBingos,
                              DailyChallengeLeaderboard,
                              DailyChallengeLeaderboardEntry)
from datetime import date, timedelta
from base.models import Lexicon
import time


def genPksByDC(dcName, num, minDate, maxDate, lex):
    qset = DailyChallenge.objects.filter(lexicon=lex).filter(
        date__range=(minDate, maxDate)).filter(name=dcName)
    mbs = DailyChallengeMissedBingos.objects.filter(challenge__in=list(qset))

    dcDict = {}
    # how many people did each challenge? store this to avoid looking it up
    for dc in qset:
        try:
            lb = DailyChallengeLeaderboard.objects.get(challenge=dc)
            entries = DailyChallengeLeaderboardEntry.objects.filter(
                board=lb, qualifyForAward=True)
            dcDict[dc] = len(entries)
        except DailyChallengeLeaderboard.DoesNotExist:
            # shouldn't ever happen
            dcDict[dc] = 1e6    # an abnormally large number

    print "challenge dict", dcDict

    mbDict = {}

    # now sort by percentage missed
    for b in mbs:
        percCorrect = float(b.numTimesMissed) / dcDict[b.challenge]
        if b.alphagram.pk in mbDict:
            if percCorrect > mbDict[b.alphagram.pk][1]:
                mbDict[b.alphagram.pk] = b.alphagram, percCorrect
        else:
            mbDict[b.alphagram.pk] = b.alphagram, percCorrect

    #print "mbDict", mbDict

    bingers = sorted(mbDict.items(), key=lambda x: x[1][1], reverse=True)[:num]
    return bingers


# for toughie challenges
def challengeDateFromReqDate(reqDate):
    diff = (reqDate.isoweekday() -
            DailyChallengeName.WEEKS_BINGO_TOUGHIES_ISOWEEKDAY)
    if diff < 0:
        diff = 7-abs(diff)

    chDate = reqDate - timedelta(days=diff)
    return chDate


def genPks(lex, reqDate):
    t1 = time.time()
    chDate = challengeDateFromReqDate(reqDate)
    minDate = chDate - timedelta(days=7)
    maxDate = chDate - timedelta(days=1)
    print "minDate", minDate, "maxDate", maxDate

    pks = genPksByDC(DailyChallengeName.objects.get(name="Today's 7s"), 25,
                     minDate, maxDate, lex)
    pks.extend(genPksByDC(DailyChallengeName.objects.get(
        name="Today's 8s"), 25, minDate, maxDate, lex))

    print "time to gen", time.time() - t1
    return pks


class Command(BaseCommand):
    help = """Shows challenge alphas for toughie bingos; this is more of a
                debug command and is not intended to be run in production
                needs a lexicon"""

    def handle(self, *args, **options):
        if len(args) < 1:
            raise CommandError("Must have a lexicon name argument")
        try:
            lex = Lexicon.objects.get(lexiconName=args[0])
        except:
            raise CommandError("That lexicon does not exist!")
        # generate challenges from this week's missed bingos
        # first, find all the challenges that match. search back in time
        # 7 days from chDate, not including chDate
        pks = genPks(lex, date.today())
        print "PKS", pks

