# cleans up wordwallstablegames that are older than specified number of
# days in the past

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from wordwalls.models import WordwallsGameModel
from datetime import timedelta


class Command(BaseCommand):
    args = 'days'
    help = """
    Deletes Wordwalls Table Games that are older than d days in the past
    """

    def handle(self, *args, **options):
        if len(args) != 1:
            raise CommandError('There must be exactly one argument; the '
                               'number of days in the past')
        days = int(args[0])
        delDate = timezone.now() - timedelta(days=days)
        wgms = WordwallsGameModel.objects.filter(lastActivity__lt=delDate)
        numObjs = len(wgms)
        print "Found", numObjs, "objects to delete"
        if numObjs > 0:
            for wgm in wgms:
                print "Delete", wgm
                if wgm.word_list and wgm.word_list.is_temporary:
                    print "-- Delete", wgm.word_list
                    wgm.word_list.delete()
                wgm.delete()
