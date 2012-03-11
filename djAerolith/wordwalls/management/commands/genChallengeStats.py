# cleans up DailyChallenges that are older than specified number of days in the past

from django.core.management.base import BaseCommand, CommandError
from wordwalls.models import (DailyChallenge,
                                DailyChallengeLeaderboard,
                                DailyChallengeLeaderboardEntry)

from datetime import datetime, timedelta

class Command(BaseCommand):
    def handle(self, *args, **options):
        days = int(args[0])
        delDate = datetime.now() - timedelta(days=days)
        dcs = DailyChallenge.objects.filter(date__lt=delDate)
        numObjs = len(dcs)
        print "Found", numObjs, "objects to delete"
        if numObjs > 0:
            for dc in dcs:
                dc.delete()
            print "Deleted!"
