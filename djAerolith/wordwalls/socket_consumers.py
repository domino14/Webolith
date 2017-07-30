import logging
import json

from channels import Group
from channels.auth import channel_session_user, channel_session_user_from_http
from channels_presence.models import Room, Presence
from channels_presence.signals import presence_changed
from django.db import transaction
from django.dispatch import receiver

from wordwalls.game import WordwallsGame
from wordwalls.models import WordwallsGameModel
logger = logging.getLogger(__name__)


LOBBY_CHANNEL_NAME = 'lobby'
ACTIVE_SECONDS = 60


def host_switched_msg(user, room):
    return {
        'type': 'newHost',
        'contents': {
            'host': user.username,
            'room': room.channel_name,
        }
    }


def users_in(room):
    return {
        'type': 'presence',
        'contents': {
            'room': room.channel_name,
            'users': [user.username for user in room.get_users()],
        }
    }


def table_info(table):
    state = json.loads(table.currentGameState)
    table_obj = {
        'lexicon': table.lexicon.lexiconName,
        'host': table.host.username,
        'users': [user.username for user in table.inTable.all()],
        'wordList': (
            table.word_list.name if not table.word_list.is_temporary
            else state['temp_list_name']),
        'tablenum': table.pk,
        'secondsPerRound': state['timerSecs'],
        'questionsPerRound': state['questionsToPull'],
        'multiplayer': table.playerType == WordwallsGameModel.MULTIPLAYER_GAME
    }
    return table_obj


def active_tables():
    """ Get all active tables with at least one user in them. """
    rooms = Room.objects.exclude(channel_name=LOBBY_CHANNEL_NAME)
    tables = []
    for room in rooms:
        try:
            tables.append(WordwallsGameModel.objects.get(pk=room.channel_name))
        except WordwallsGameModel.DoesNotExist:
            pass

    return {
        'type': 'tableList',
        'contents': {
            'tables': [table_info(table) for table in tables]
        }
    }


@receiver(presence_changed)
def broadcast_presence(sender, room, **kwargs):
    # Broadcast the new list of present users to the room.
    logger.debug('Presence changed triggered, users: %s', room.get_users())
    presence_payload = {
        'text': json.dumps(users_in(room))
    }
    # Instead of sending it to the group, send it to the lobby. Everyone
    # is always in the lobby, so the front end logic will take care of
    # showing presences.
    Group(LOBBY_CHANNEL_NAME).send(presence_payload)


@receiver(presence_changed)
def update_in_room(sender, room, added, removed, bulk_change, **kwargs):
    """
    When a presence changes, besides broadcasting it to the lobby, we
    also need to update any table instances. It sucks to keep presence
    in both places, in a way, but we should encapsulate our own access
    (in wordwalls app) and not rely on the presence app to figure out
    game-related logic... right?

    """
    logger.debug('Update in room called, room=%s', room)
    if room.channel_name == LOBBY_CHANNEL_NAME:
        return   # broadcast presence above is enough
    # Otherwise, get the relevant table.
    try:
        table = WordwallsGameModel.objects.get(pk=room.channel_name)
    except WordwallsGameModel.DoesNotExist:
        logger.error('Table %s does not exist', room)
        return
    if added:
        logger.debug('Adding user to inTable: %s', added)
        table.inTable.add(added.user)
    if removed:
        logger.debug('Removing user from inTable: %s', removed)
        table.inTable.remove(removed.user)
        if removed.user == table.host:
            # Change host.
            change_host(table, room)
    if bulk_change:
        # Need to get set of users in table, and do some sort of intersection
        # with the presences.
        # From the codebase, it appears this only gets sent for a bulk
        # remove, but we'll handle adds just in case. This only would also
        # happen in a timed prune task, so there's not that much risk for
        # race conditions.
        intable = set([user for user in table.inTable.all()])
        presences = set([user for user in room.get_users()])
        to_add = presences - intable
        to_remove = intable - presences
        logger.debug('Bulk change - to_add: %s, to_remove: %s', to_add,
                     to_remove)
        for user in to_add:
            table.inTable.add(user)
        for user in to_remove:
            table.inTable.remove(user)
            if user == table.host:
                change_host(table, room)


def change_host(table, room):
    """
    Change the host of a table to, I suppose, the "next" user in that
    table.

    """
    logger.debug('Changing the host of room %s', room)
    still_there = table.inTable.all()
    if still_there.count():
        new_host = still_there[0]
        table.host = new_host
        table.save()
        logger.debug('The new host is %s', new_host)
        Group(LOBBY_CHANNEL_NAME).send({
            'text': json.dumps(host_switched_msg(new_host, room))
        })


@channel_session_user_from_http
def ws_connect(message):
    logger.debug('Connected to lobby! User: %s', message.user.username)
    # Accept connection
    message.reply_channel.send({'accept': True})
    # We always allow connections to the 'lobby'
    Room.objects.add(LOBBY_CHANNEL_NAME, message.reply_channel.name,
                     message.user)
    message.reply_channel.send({
        'text': json.dumps(users_in(Room.objects.get(
            channel_name=LOBBY_CHANNEL_NAME)))
    })


@channel_session_user
def ws_disconnect(message):
    if 'room' in message.channel_session:
        room = message.channel_session['room']
        Room.objects.remove(room, message.reply_channel.name)
        logger.debug('User %s left table %s', message.user.username, room)
    logger.debug('User %s left lobby', message.user.username)
    Room.objects.remove(LOBBY_CHANNEL_NAME, message.reply_channel.name)


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

    elif msg_contents['type'] == 'getTables':
        send_tables(message, msg_contents)

    elif msg_contents['type'] == 'start':
        table_start(message, msg_contents)

    elif msg_contents['type'] == 'timerEnded':
        table_timer_ended(message, msg_contents)

    elif msg_contents['type'] == 'giveup':
        table_giveup(message, msg_contents)


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
    logger.debug('User %s joined room %s', message.user.username, tableid)
    Room.objects.add(tableid, message.reply_channel.name, message.user)
    message.channel_session['room'] = tableid

    message.reply_channel.send({
        'text': json.dumps(users_in(Room.objects.get(channel_name=tableid)))
    })
    # Also, send the user the current time left / game state if the game
    # is already going.
    state = wwg.midgame_state(tableid)
    if not state['going']:
        return
    message.reply_channel.send({
        'text': json.dumps({
            'type': 'gameGoingPayload',
            'contents': state
        })
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
            's': state['solver'],
        }
    }
    Group(room).send({'text': json.dumps(msg)})


def table_start(message, contents):
    room = message.channel_session['room']
    if room != contents['room']:
        logger.warning('User sent message to room %s, but in room %s',
                       contents['room'], room)
        return
    wwg = WordwallsGame()
    with transaction.atomic():
        quiz_params = wwg.start_quiz(room, message.user)
    if 'error' in quiz_params:
        msg = {
            'type': 'server',
            'contents': {
                'error': quiz_params['error'],
            }
        }
        Group(room).send({'text': json.dumps(msg)})
        return
    # Send the payload to everyone in the room.
    Group(room).send({
        'text': json.dumps({
            'type': 'gamePayload',
            'contents': quiz_params
        })
    })


def table_giveup(message, contents):
    room = message.channel_session['room']
    if room != contents['room']:
        logger.warning('User sent message to room %s, but in room %s',
                       contents['room'], room)
        return
    wwg = WordwallsGame()
    with transaction.atomic():
        success = wwg.give_up(message.user, room)

    if success is not True:
        Group(room).send({
            'text': json.dumps({
                'type': 'server',
                'contents': {
                    'error': success
                }
            })
        })
        return
    # No need to send the game over message, the send_game_ended function
    # should be triggered below.


def table_timer_ended(message, contents):
    try:
        room = message.channel_session['room']
    except KeyError:
        return
    if room != contents['room']:
        logger.warning('User sent message to room %s, but in room %s',
                       contents['room'], room)
        return
    wwg = WordwallsGame()
    with transaction.atomic():
        wwg.check_game_ended(room)
    # If the game ended this will get broadcast to everyone.


def send_tables(message, msg_contents):
    """ Send info about current multiplayer tables. """
    message.reply_channel.send({
        'text': json.dumps(active_tables())
    })


def send_game_ended(tablenum):
    """ This is called by the main game class when the game is ended. """
    msg = {
        'type': 'gameOver',
        'contents': {
            'room': tablenum
        }
    }
    Group(tablenum).send({
        'text': json.dumps(msg)
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
    if room == LOBBY_CHANNEL_NAME:
        Group(LOBBY_CHANNEL_NAME).send({
            'text': json.dumps(msg)
        })
    else:
        session_room = message.channel_session['room']
        if room != session_room:
            return
        Group(room).send({
            'text': json.dumps(msg)
        })


def set_presence(message, contents):
    """ This is a periodic ping from the client. Set the last ping time. """
    Presence.objects.touch(message.reply_channel.name)
