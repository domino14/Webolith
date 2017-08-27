# Aerolith 2.0: A web-based word game website
# Copyright (C) 2011 Cesar Del Solar
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

# To contact the author, please email delsolar at gmail dot com

# Create your views here.

import json
import time
import os
import logging
import calendar
import hmac
import hashlib

from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.conf import settings
from django.utils.translation import ugettext as _
from django.views.decorators.http import require_http_methods
from gargoyle import gargoyle

from base.forms import LexiconForm
from base.models import Lexicon, WordList, EXCLUDED_LEXICA
from wordwalls.game import WordwallsGame
from lib.word_db_helper import WordDB
from wordwalls.models import (DailyChallenge, DailyChallengeLeaderboard,
                              DailyChallengeLeaderboardEntry,
                              DailyChallengeName, Medal, WordwallsGameModel)
import wordwalls.settings
from lib.response import response, StatusCode
from base.utils import get_alphas_from_words, UserListParseException
from current_version import CURRENT_VERSION
from wordwalls.challenges import toughies_challenge_date

logger = logging.getLogger(__name__)


@login_required
@require_http_methods(['GET', 'POST'])
def table(request, tableid=None):
    if request.method == 'POST':
        return handle_table_post(request, tableid)
    # Otherwise, it's a GET
    wwg = WordwallsGame()
    if tableid:
        # Check if the user is allowed to enter this table.
        permitted = wwg.allow_access(request.user, tableid)
        if gargoyle.is_active('disable_games', request):
            permitted = False
        if not permitted:
            return render(request, 'wordwalls/notPermitted.html',
                          {'tablenum': tableid})
    params = wwg.get_add_params(tableid)
    # Add styling params from user's profile (for styling table
    # tiles, backgrounds, etc)
    profile = request.user.aerolithprofile
    style = profile.customWordwallsStyle
    if style != "":
        params['style'] = style

    meta_info = get_create_meta_info()
    usermeta = get_user_meta_info(request.user)
    wgm = None
    if tableid:
        wgm = wwg.get_wgm(tableid, False)

    return render(
        request, 'wordwalls/table.html',
        {'tablenum': tableid if tableid else 0,
         'current_host': wgm.host.username if wgm else '',
         'multiplayer': (
             json.dumps(
                 wgm.playerType == WordwallsGameModel.MULTIPLAYER_GAME if wgm
                 else False)
         ),
         'user': json.dumps(usermeta),
         'socket_server': settings.SOCKET_SERVER,
         'addParams': json.dumps(params),
         'avatarUrl': profile.avatarUrl,
         'CURRENT_VERSION': CURRENT_VERSION,
         'lexicon': wgm.lexicon.lexiconName if wgm else None,
         'default_lexicon': profile.defaultLexicon.pk,
         'challenge_info': json.dumps(meta_info['challenge_info']),
         'available_lexica': json.dumps(meta_info['lexica']),
         'intercom_app_id': settings.INTERCOM_APP_ID,
         })


# Helpers.
def get_user_meta_info(user):
    """ Get info from user, such as name, email, created date, etc. """
    user_hash = hmac.new(
        settings.INTERCOM_APP_SECRET_KEY, user.email, digestmod=hashlib.sha256
    ).hexdigest()
    return {
        'name': u'{0} {1}'.format(user.first_name, user.last_name),
        'username': user.username,
        'email': user.email,
        'createdAt': calendar.timegm(user.date_joined.utctimetuple()),
        'user_hash': user_hash,
    }


def get_create_meta_info():
    """ Return meta info for table creation. This would be good to cache. """
    challenge_info = []
    for i in DailyChallengeName.objects.all():
        challenge_info.append({
            'id': i.pk,
            'seconds': i.timeSecs,
            'numQuestions': i.num_questions,
            'name': i.name,
            'orderPriority': i.orderPriority,
        })
    lexica = []
    for l in Lexicon.objects.exclude(lexiconName__in=EXCLUDED_LEXICA):
        lexica.append({
            'id': l.pk,
            'lexicon': l.lexiconName,
            'description': l.lexiconDescription,
            'lengthCounts': json.loads(l.lengthCounts),
        })
    return {
        'challenge_info': challenge_info,
        'lexica': lexica
    }


def handle_table_post(request, tableid):
    """ XXX: This function should be separated into several RPC style
    API functions. """
    action = request.POST['action']
    logger.debug(u'user=%s, action=%s, table=%s', request.user, action,
                 tableid)

    if not tableid or int(tableid) == 0:   # Kind of hacky.
        return response({
            'success': False,
            'error': _('Table does not exist, please load a new word list.')},
            status=StatusCode.BAD_REQUEST)
    if action == "start":
        # XXX: Deprecated, this is handled by socket, remove after deploy.
        logger.debug('old-way start')
        return response({
            'success': False,
            'error': _('App has been updated; please refresh your page.')},
            status=StatusCode.BAD_REQUEST)
    elif action == "gameEnded":
        wwg = WordwallsGame()
        ret = wwg.check_game_ended(tableid)
        # 'going' is the opposite of 'game ended'
        return response({'g': not ret})

    elif action == "save":
        wwg = WordwallsGame()
        ret = wwg.save(request.user, tableid, request.POST['listname'])
        return response(ret)
    elif action == "giveUpAndSave":
        wwg = WordwallsGame()
        ret = wwg.give_up_and_save(request.user, tableid,
                                   request.POST['listname'])
        logger.debug("Give up and saving returned: %s" % ret)
        return response(ret)
    elif action == "savePrefs":
        profile = request.user.aerolithprofile
        profile.customWordwallsStyle = request.POST['prefs']
        profile.save()
        return response({'success': True})
    elif action == "getDcData":
        wwg = WordwallsGame()
        dcId = wwg.get_dc_id(tableid)
        if dcId > 0:
            leaderboardData = getLeaderboardDataDcInstance(
                DailyChallenge.objects.get(pk=dcId))
            return response(leaderboardData)

    return response({'success': False, 'error': _('Unhandled action.')},
                    status=StatusCode.BAD_REQUEST)


def start_game(request, tableid):
    if gargoyle.is_active('disable_games', request):
        return response(
            {'serverMsg': _(
                'The Aerolith server is currently undergoing '
                'maintenance. Please try again in a few minutes.')})
    wwg = WordwallsGame()
    quiz_params = wwg.start_quiz(tableid, request.user)
    if 'error' in quiz_params:
        return response(quiz_params, StatusCode.BAD_REQUEST)
    return response(quiz_params)


@login_required
def ajax_upload(request):
    if request.method != "POST":
        return response(_('This endpoint only accepts POST'),
                        StatusCode.BAD_REQUEST)

    lex_form = LexiconForm(request.POST)

    if lex_form.is_valid():
        lex = Lexicon.objects.get(
            lexiconName=lex_form.cleaned_data['lexicon'])
    else:
        logger.debug(lex_form.errors)
        return response(_('Bad lexicon.'), StatusCode.BAD_REQUEST)

    uploaded_file = request.FILES['file']
    if uploaded_file.multiple_chunks():
        return response(_('Your file is too big.'), StatusCode.BAD_REQUEST)

    filename = uploaded_file.name
    try:
        file_contents = uploaded_file.read().decode('utf-8')
    except UnicodeDecodeError:
        return response(_('Please make sure your file is utf-8 encoded.'),
                        StatusCode.BAD_REQUEST)
    # save the file
    success, msg = create_user_list(file_contents, filename, lex,
                                    request.user)
    if not success:
        return response(msg, StatusCode.BAD_REQUEST)
    return response(msg)


def create_user_list(contents, filename, lex, user):
    """
    Creates a user list from file contents, a filename, a lexicon,
    and a user. Checks to see if the user can create more lists.

    """
    filename_stripped, extension = os.path.splitext(filename)
    try:
        WordList.objects.get(name=filename_stripped, user=user, lexicon=lex)
        # uh oh, it exists!
        return (
            False,
            _("A list by the name {} already exists for this "
              "lexicon! Please rename your file.").format(filename_stripped))
    except WordList.DoesNotExist:
        pass
    t1 = time.time()
    try:
        alphas = get_alphas_from_words(
            contents, wordwalls.settings.UPLOAD_FILE_LINE_LIMIT)
    except UserListParseException as e:
        return (False, str(e))

    profile = user.aerolithprofile
    num_saved_alphas = profile.wordwallsSaveListSize
    limit = settings.SAVE_LIST_LIMIT_NONMEMBER

    if (num_saved_alphas + len(alphas)) > limit and not profile.member:
        return False, _(
            'This list would exceed your total list size limit. You can '
            'remove this limit by upgrading your membership!')
    db = WordDB(lex.lexiconName)

    questions = db.get_questions(alphas)
    num_alphagrams = questions.size()

    logger.info('number of uploaded alphagrams: %d', num_alphagrams)
    logger.info('elapsed time: %f', time.time() - t1)
    logger.info('user: %s, filename: %s', user.username, filename)

    wl = WordList()
    wl.name = filename_stripped
    wl.initialize_list(questions.to_python(), lex, user, shuffle=True,
                       keep_old_name=True)
    profile.wordwallsSaveListSize += num_alphagrams
    profile.save()

    return True, ''


def getLeaderboardDataDcInstance(dc):
    """
    Gets leaderboard data given a daily challenge instance.
    Returns a dictionary of `entry`s.

    """
    try:
        lb = DailyChallengeLeaderboard.objects.get(challenge=dc)
    except DailyChallengeLeaderboard.DoesNotExist:
        return None

    lbes = DailyChallengeLeaderboardEntry.objects.filter(board=lb)
    retData = {'maxScore': lb.maxScore, 'entries': []}
    medals = Medal.objects.filter(leaderboard=lb)
    medal_hash = {}
    for m in medals:
        medal_hash[m.user] = m.get_medal_type_display()
    entries = []
    for lbe in lbes:
        # Check if this user has a medal.
        # XXX: This can be made faster later by just returning the medals
        # and letting the front end calculate what medal belongs where.
        addl_data = None
        if lbe.user in medal_hash:
            addl_data = json.dumps({'medal': medal_hash[lbe.user]})
        entry = {'user': lbe.user.username,
                 'score': lbe.score, 'tr': lbe.timeRemaining,
                 'addl': addl_data}
        entries.append(entry)

    def cmpFunction(e1, e2):
        if e1['score'] != e2['score']:
            return int(e2['score'] - e1['score'])
        else:
            return int(e2['tr'] - e1['tr'])

    entries = sorted(entries, cmpFunction)
    retData['entries'] = entries
    retData['challengeName'] = dc.name.name
    retData['lexicon'] = dc.lexicon.lexiconName
    return retData


def getLeaderboardData(lex, chName, challengeDate):
    if chName.name == DailyChallengeName.WEEKS_BINGO_TOUGHIES:
        chdate = toughies_challenge_date(challengeDate)
    else:
        chdate = challengeDate
    try:
        dc = DailyChallenge.objects.get(lexicon=lex, date=chdate,
                                        name=chName)
    except DailyChallenge.DoesNotExist:
        return None  # daily challenge doesn't exist

    return getLeaderboardDataDcInstance(dc)


@login_required
def mark_missed(request, tableid):
    wwg = WordwallsGame()
    marked = wwg.mark_missed(request.POST['idx'], tableid, request.user)
    return response({'success': marked})
