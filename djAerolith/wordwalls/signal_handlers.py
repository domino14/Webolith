import json
import logging

from channels import Group
from django.dispatch import Signal, receiver

from wordwalls.socket_consumers import table_info
logger = logging.getLogger(__name__)
# Create a signal for an "important" save.


def table_update(table):
    return {
        'type': 'tableUpdate',
        'contents': {
            'table': table_info(table),
            'room': 'lobby',
        }
    }
    table_info(table)


#   - changing the list, lexicon, playerType, etc (so right after loading a new
#   game, basically)
#   - adding or removing a user (not actually even a save of this model, but
#   see host)
game_important_save = Signal(providing_args=['instance'])


@receiver(game_important_save)
def game_saved(sender, instance, **kwargs):
    """ When the game is saved, send this to the socket. """
    logger.debug('Game %s just saved, send to lobby', instance)
    Group('lobby').send({
        'text': json.dumps(table_update(instance))
    })
