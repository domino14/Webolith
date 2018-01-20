# cleans up wordwallstablegames that are older than specified number of
# days in the past

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from wordwalls.models import WordwallsGameModel
from datetime import timedelta


class Command(BaseCommand):
    help = """
    Deletes Wordwalls Table Games that are older than d days in the past
    """

    def add_arguments(self, parser):
        parser.add_argument('days', type=int)

    def handle(self, *args, **options):
        if 'days' not in options:
            raise CommandError('There must be exactly one argument; the '
                               'number of days in the past')

        days = options['days']
        delDate = timezone.now() - timedelta(days=days)
        wgms = WordwallsGameModel.objects.filter(lastActivity__lt=delDate)
        numObjs = len(wgms)
        print("Found", numObjs, "objects to delete")
        if numObjs > 0:
            for wgm in wgms.iterator():
                print("Delete", wgm)
                wgm.delete()
