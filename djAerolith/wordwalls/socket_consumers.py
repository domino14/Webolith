import logging
import json
from datetime import timedelta

from channels import Channel, Group
from channels.sessions import channel_session
from channels.auth import channel_session_user, channel_session_user_from_http
from django.db import transaction
from django.db.models import Q, F
from django.utils import timezone

from tablegame.models import Presence
from wordwalls.game import WordwallsGame
from wordwalls.models import WordwallsGameModel
logger = logging.getLogger(__name__)


LOBBY_TABLE = 0
ACTIVE_SECONDS = 60


def joined_msg(user, room):
    return {
        'type': 'joined',
        'contents': {
            'user': user.username,
            'room': room,
        }
    }


def left_msg(user, room):
    return {
        'type': 'left',
        'contents': {
            'user': user.username,
            'room': room,
        }
    }


def host_switched_msg(user, room):
    return {
        'type': 'newHost',
        'contents': {
            'host': user.username,
            'room': room,
        }
    }


def presences_in(room):
    now = timezone.now()
    return Presence.objects.filter(
        room=room,
        last_ping_time__gt=(now - timedelta(seconds=ACTIVE_SECONDS))).filter(
        Q(last_left__isnull=True) | Q(last_left__lt=F('last_ping_time')))


def users_in(room, current_user):
    # Find the users in the room.
    # XXX: This still won't catch traumatic disconnections so presence
    # info could be a little off for a little bit of time.

    presences = presences_in(room)
    return {
        'type': 'usersIn',
        'contents': {
            'users': [presence.user.username for presence in presences],
            'room': room,
        }
    }


def table_info(table):
    state = json.loads(table.currentGameState)
    table_obj = {
        'lexicon': table.lexicon.lexiconName,
        'admin': table.host.username,
        'users': [user.username for user in presences_in(table)],
        'wordList': (
            table.word_list.name if not table.word_list.is_temporary
            else state['temp_list_name']),
        'tablenum': table.pk,
        'secondsPerRound': state['timerSecs'],
        'questionsPerRound': state['questionsToPull'],
    }
    return table_obj


def active_tables():
    """ Get all active tables with at least one user in them. """
    tables = WordwallsGameModel.objects.filter(
        playerType=WordwallsGameModel.MULTIPLAYER_GAME
    ).exclude(inTable=None)

    return {
        'type': 'tableList',
        'contents': [table_info(table) for table in tables]
    }


@channel_session_user_from_http
def ws_connect(message):
    logger.debug('Connected to lobby! User: %s', message.user.username)
    # Accept connection
    message.reply_channel.send({'accept': True})
    # We always allow connections to the 'lobby'
    message.channel_session['in_lobby'] = True
    Group('lobby').add(message.reply_channel)
    Group('lobby').send({
        'text': json.dumps(joined_msg(message.user, 'lobby')),
    })
    update_presence(message.user, 'lobby')
    message.reply_channel.send({
        'text': json.dumps(users_in('lobby', message.user))
    })


@channel_session_user
def ws_disconnect(message):
    now = timezone.now()
    if 'room' in message.channel_session:
        room = message.channel_session['room']
        Group('table-{0}'.format(room)).discard(message.reply_channel)
        Group('table-{0}'.format(room)).send({
            'text': json.dumps(left_msg(message.user, room))
        })
        logger.debug('User %s left table %s', message.user.username, room)
        update_presence(message.user, str(room), last_left=now)
    Group('lobby').discard(message.reply_channel)
    Group('lobby').send({
        'text': json.dumps(left_msg(message.user, 'lobby'))
    })
    update_presence(message.user, 'lobby', last_left=now)


@channel_session_user
def ws_message(message):
    logger.debug('Got a message from %s: %s', message.user.username,
                 message['text'])
    msg_contents = json.loads(message['text'])
    # Schema of msg_contents
    #   'room' - lobby or tablenum
    #   'type' - chat, it goes down in the DM, guess, other game action?
    #   'contents' - The chat, the message, the guess, etc.
    if msg_contents['type'] == 'join':
        table_join(message, msg_contents)
    elif msg_contents['type'] == 'guess':
        table_guess(message, msg_contents)

    elif msg_contents['type'] == 'chat':
        chat(message, msg_contents)

    elif msg_contents['type'] == 'presence':
        set_presence(message, msg_contents)

    elif msg_contents['type'] == 'getPresence':
        send_presence(message, msg_contents)

    elif msg_contents['type'] == 'getTables':
        send_tables(message, msg_contents)


def table_join(message, contents):
    wwg = WordwallsGame()
    tableid = contents['room']
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
    update_presence(message.user, str(tableid))
    message.channel_session['room'] = tableid
    for group_name in ['table-{0}'.format(tableid), 'lobby']:
        Group(group_name).send({
            'text': json.dumps(joined_msg(message.user, tableid)),
        })
    message.reply_channel.send({
        'text': json.dumps(users_in('{0}'.format(tableid),
                                    message.user))
    })


# XXX: Could move to another worker
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


def send_presence(message, msg_contents):
    """ Send presence info to the requester. """
    room = msg_contents['room']
    message.reply_channel.send({
        'text': json.dumps(users_in(room, message.user))
    })


def send_tables(message, msg_contents):
    """ Send info about current multiplayer tables. """
    message.reply_channel.send({
        'text': json.dumps(active_tables())
    })


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


def set_presence(message, contents):
    """ This is a periodic ping from the server. Set the last ping time. """
    room = contents['room']
    user = message.user
    update_presence(user, room)


def update_presence(user, room, last_left=None):
    """
    Update the presence, and if a table is involved, also update the
    inTable info.

    """

    Presence.objects.update_or_create(user=user, room=room,
                                      defaults={'last_left': last_left})
    if room == 'lobby':
        return
    try:
        wgm = WordwallsGameModel.objects.get(pk=room)
    except WordwallsGameModel.DoesNotExist:
        logger.warning('update_presence for room %s which does not exist',
                       room)

    if last_left:
        # send_host_switch = False
        # new_host = None
        # user just left, so exclude him.
        presences = presences_in(room).exclude(user=user)
        with transaction.atomic():
            if user == wgm.host and presences.count() > 0:
                new_host = presences[0].user
                wgm.host = new_host
                wgm.save()
                # XXX: signalhandler should take care of this, but test.
                # send_host_switch = True
            # Otherwise, don't change the host. That way maybe the
            # original user can come back later, the way it used to be.
        # if send_host_switch:
        #     Group('table-{0}'.format(room)).send({
        #         'text': json.dumps(host_switched_msg(new_host, room))
        #     })
