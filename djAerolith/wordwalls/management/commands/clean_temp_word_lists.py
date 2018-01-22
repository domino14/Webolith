# this should hopefully only be run once.

from django.core.management.base import BaseCommand
from django.utils import timezone

from base.models import WordList
from datetime import timedelta


class Command(BaseCommand):
    args = 'days'
    help = """
    Deletes Temporary Word Lists that have not been saved in over a week.
    """

    def handle(self, *args, **options):
        del_date = timezone.now() - timedelta(days=7)
        wls = WordList.objects.filter(lastSaved__lt=del_date,
                                      is_temporary=True)
        num_objs = len(wls)
        print("Found", num_objs, "objects to delete")
        wls.delete()
