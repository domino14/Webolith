from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from subprocess import Popen
import datetime
import os

MAX_ANSWERS_PER_QUESTION = 10


class Command(BaseCommand):
    help = """Generates blank bingo challenges for tomorrow. This function
    should be called as early as possible, but after 1 AM in case of DST
    issues."""

    def handle(self, *args, **options):
        if len(args) != 0:
            raise CommandError("No arguments required")
        tomorrow = datetime.datetime.today() + datetime.timedelta(days=1)

        executable = os.path.join(settings.UJAMAA_PATH, 'src', 'anagrammer',
                                  'blank_challenges')
        gaddag_path = os.path.join(settings.UJAMAA_PATH, 'words')
        for lexicon in ('CSW12', 'OWL2'):
            for length in (7, 8):
                path = os.path.join(os.getenv("HOME"), 'blanks',
                                    '%s-%s-%ss.txt' % (
                                        tomorrow.strftime('%Y-%m-%d'),
                                        lexicon, length))
                cmd = [executable,
                       os.path.join(gaddag_path, '%s.gaddag' % lexicon),
                       '25',
                       '%s' % MAX_ANSWERS_PER_QUESTION,
                       '%s' % length,
                       path]
                p = Popen(cmd)
                p.wait()
