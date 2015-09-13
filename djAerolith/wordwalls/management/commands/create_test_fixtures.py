"""
Creates some test alphagram and word fixtures. For right now, just
create fixtures for the following parameters, in order to speed up
load time:

- America and CSW15 lexica only
- Alphagram probability 1 to 110
- Word lengths 5 to 8
"""

from django.core.management.base import BaseCommand
from base.models import Alphagram, Word, Lexicon
from django.core.management import call_command
from django.conf import settings
import os


class Command(BaseCommand):
    def handle(self, *args, **options):
        america = Lexicon.objects.get(lexiconName='America')
        CSW15 = Lexicon.objects.get(lexiconName='CSW15')
        alphagrams = Alphagram.objects.filter(
            lexicon__in=[america, CSW15],
            probability__range=(1, 110),
            length__range=(5, 8))
        words = Word.objects.filter(
            alphagram__pk__in=[alph.pk for alph in alphagrams])

        call_command('dumpdata',
                     'base.alphagram',
                     format='json',
                     indent=2,
                     output=os.path.join(settings.PROJECT_ROOT, 'wordwalls',
                                         'fixtures', 'test',
                                         'alphagrams.json'),
                     pks=','.join([str(alph.pk) for alph in alphagrams]))
        call_command('dumpdata',
                     'base.word',
                     format='json',
                     indent=2,
                     output=os.path.join(settings.PROJECT_ROOT, 'wordwalls',
                                         'fixtures', 'test',
                                         'words.json'),
                     pks=','.join([str(word.pk) for word in words]))
