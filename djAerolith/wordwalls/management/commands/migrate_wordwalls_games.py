"""
Migrate wordwalls games.

"""

import logging
import json
import uuid

from django.core.management.base import BaseCommand

from base.models import WordList
from wordwalls.models import WordwallsGameModel
logger = logging.getLogger(__name__)

FETCH_MANY_SIZE = 1000


def migrate_table_word_list(wgm, state):
    """
    Migrate to the V1 version. This will eventually also be migrated
    to the V2 version, but let's make this simple for now.
    """
    word_list = WordList.objects.create(
        lexicon=wgm.lexicon,
        name=uuid.uuid4().hex,
        is_temporary=True,
        user=wgm.host,
        numAlphagrams=wgm.numOrigQuestions,
        numCurAlphagrams=wgm.numCurQuestions,
        numFirstMissed=wgm.numFirstMissed,
        numMissed=wgm.numMissed,
        goneThruOnce=state['goneThruOnce'],
        questionIndex=state['questionIndex'],
        origQuestions=wgm.origQuestions,
        curQuestions=wgm.curQuestions,
        missed=wgm.missed,
        firstMissed=wgm.firstMissed,
        version=1
    )
    wgm.word_list = word_list
    wgm.save()
    return word_list


class Command(BaseCommand):
    def handle(self, *args, **options):
        games = WordwallsGameModel.objects.count()
        logger.debug('Number of games: %s', games)
        for game in WordwallsGameModel.objects.all():
            state = json.loads(game.currentGameState)
            if 'saveName' in state:
                try:
                    game.word_list = WordList.objects.get(
                        name=state['saveName'],
                        lexicon=game.lexicon,
                        user=game.host)
                except WordList.DoesNotExist:
                    logger.warning('Could not get word list: %s %s %s',
                                   game.pk, state['saveName'],
                                   game.host.username)
                    logger.warning('This list could possibly have been '
                                   'deleted\n####################')
                    continue
                game.save()
            else:
                migrate_table_word_list(game, state)
