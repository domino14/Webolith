"""
Migrate wordwalls games.

"""

import logging
import json
import uuid

from django.core.management.base import BaseCommand, CommandError

from base.models import WordList
from wordwalls.models import WordwallsGameModel
logger = logging.getLogger(__name__)

FETCH_MANY_SIZE = 1000


class Command(BaseCommand):
    args = 'wtf'

    def handle(self, *args, **options):
        print len(args)
        if len(args) != 1:
            raise CommandError('The argument is the command to send.')
        print 'args', args
