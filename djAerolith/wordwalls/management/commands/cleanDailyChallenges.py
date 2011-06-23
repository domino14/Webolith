# cleans up DailyChallenges that are older than specified number of days in the past

from django.core.management.base import BaseCommand, CommandError
from wordwalls.models import DailyChallenge
from datetime import datetime, timedelta

class Command(BaseCommand):
    args = 'days'
    help = 'Deletes DailyChallenge instances that are older than d days in the past, and all the models tied to each instance by ForeignKeys'

    def handle(self, *args, **options):
        if len(args) != 1:
            raise CommandError('There must be exactly one argument; the number of days in the past')
        else:
            days = int(args[0])
            delDate = datetime.now() - timedelta(days=days)
            dcs = DailyChallenge.objects.filter(date__lt=delDate)
            numObjs = len(dcs)
            print "Found", numObjs, "objects to delete"
            if numObjs > 0:
                for dc in dcs:
                    dc.delete()
                print "Deleted!"
