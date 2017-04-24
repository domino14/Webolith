import logging
import json

from channels import Channel, Group
from channels.sessions import channel_session
from channels.auth import channel_session_user, channel_session_user_from_http
from django.db import transaction

from wordwalls.game import WordwallsGame
logger = logging.getLogger(__name__)


LOBBY_TABLE = 0


@channel_session_user_from_http
def ws_connect(message):
    logger.debug('Connected to lobby! User: %s', message.user.username)
    # Accept connection
    message.reply_channel.send({'accept': True})
    # We always allow connections to the 'lobby'
    message.channel_session['in_lobby'] = True
    Group('lobby').add(message.reply_channel)


@channel_session_user
def ws_disconnect(message):
    if 'room' in message.channel_session:
        room = message.channel_session['room']
        Group('table-{0}'.format(room)).discard(message.reply_channel)
        logger.debug('User %s left table %s', message.user.username, room)
    Group('lobby').discard(message.reply_channel)


@channel_session_user
def ws_message(message):
    logger.debug('Got a message: %s', message['text'])
    msg_contents = json.loads(message['text'])
    # Schema of msg_contents
    #   'room' - lobby or tablenum
    #   'type' - chat, it goes down in the DM, guess, other game action?
    #   'contents' - The chat, the message, the guess, etc.
    if msg_contents['type'] == 'join':
        wwg = WordwallsGame()
        tableid = msg_contents['room']
        permitted = wwg.permit(message.user, tableid)
        if not permitted:
            msg = {
                'type': 'server',
                'contents': {
                    'error': 'You are not permitted to join this table.'
                }
            }
            message.reply_channel.send({'text': json.dumps(msg)})
            return
        Group('table-{0}'.format(tableid)).add(message.reply_channel)
        logger.debug('User %s joined room %s', message.user.username, tableid)
        message.channel_session['room'] = tableid

    elif msg_contents['type'] == 'guess':
        table_guess(message, msg_contents)

    elif msg_contents['type'] == 'chat':
        chat(message, msg_contents)


def table_guess(message, contents):
    room = message.channel_session['room']
    if room != contents['room']:
        logger.warning('User sent message to room %s, but in room %s',
                       contents['room'], room)
        return
    guess = contents['contents']['guess']
    wwg = WordwallsGame()
    with transaction.atomic():
        # Replicate atomic request behavior. We need this for select_for_update
        state = wwg.guess(guess.strip(), room, message.user)
    if state is None:
        msg = {
            'type': 'server',
            'contents': {
                'error': 'Quiz is already over',
            }
        }
        message.reply_channel.send({'text': json.dumps(msg)})
        return
    msg = {
        'type': 'guessResponse',
        'contents': {
            'g': state['going'],
            'C': state['alphagram'],
            'w': state['word'],
            'a': state['already_solved'],
        }
    }
    message.reply_channel.send({'text': json.dumps(msg)})


def chat(message, contents):
    room = contents['room']
    msg = {
        'type': 'chat',
        'contents': {
            'chat': contents['contents']['chat'],
            'sender': message.user.username,
            'room': room
        }
    }
    if room == 'lobby':
        Group('lobby').send({
            'text': json.dumps(msg)
        })
    else:
        pass  # TODO check channel session and accept message if user in room.
