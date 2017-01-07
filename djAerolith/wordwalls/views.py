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
from datetime import date, datetime

from django.http import Http404
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.core.urlresolvers import reverse
from django.conf import settings
from django.utils.translation import ugettext as _
from gargoyle import gargoyle

from forms import TimeForm, DailyChallengesForm
from base.forms import (FindWordsForm, UserListForm, SavedListForm,
                        LexiconForm, NamedListForm, NumQuestionsForm)
from base.models import Lexicon, WordList, EXCLUDED_LEXICA
from lib.dates import pretty_date
from wordwalls.game import WordwallsGame, GameInitException
from lib.word_searches import SearchDescription
from lib.word_db_helper import WordDB
from wordwalls.models import (DailyChallenge, DailyChallengeLeaderboard,
                              DailyChallengeLeaderboardEntry,
                              DailyChallengeName, NamedList, Medal)
import wordwalls.settings
from lib.response import response, StatusCode
from base.utils import get_alphas_from_words, UserListParseException
from current_version import CURRENT_VERSION
from wordwalls.challenges import toughies_challenge_date


logger = logging.getLogger(__name__)


@login_required
def homepage(request):
    #unbound forms
    lexForm = LexiconForm()
    timeForm = TimeForm()
    fwForm = FindWordsForm()
    dcForm = DailyChallengesForm()
    ulForm = UserListForm()
    slForm = SavedListForm()
    nlForm = NamedListForm()
    num_q_form = NumQuestionsForm()
    profile = request.user.aerolithprofile

    if request.method == 'POST':
        return handle_homepage_post(profile, request)

    lengthCounts = dict([(l.lexiconName, l.lengthCounts)
                        for l in Lexicon.objects.all()])
    # Create a random token for socket connection and store in Redis
    # temporarily.
    # conn_token = get_connection_token(request.user)
    profile = request.user.aerolithprofile
    try:
        data = json.loads(profile.additional_data)
    except (TypeError, ValueError):
        data = {}

    dc_map = {}
    for i in DailyChallengeName.objects.all():
        dc_map[i.pk] = {
            'seconds': i.timeSecs,
            'questions': i.num_questions
        }

    return render(
        request,
        'wordwalls/index.html',
        {'fwForm': fwForm,
         'dcForm': dcForm,
         'challengeTypes': [(n.pk, n.name) for n in
                            DailyChallengeName.objects.all()],
         'ulForm': ulForm,
         'slForm': slForm,
         'lexForm': lexForm,
         'timeForm': timeForm,
         'nlForm': nlForm,
         'lengthCounts': json.dumps(lengthCounts),
         'upload_list_limit': wordwalls.settings.UPLOAD_FILE_LINE_LIMIT,
         'dc_info': json.dumps(dc_map),
         'defaultLexicon': profile.defaultLexicon,
         'num_q_form': num_q_form,
         # 'connToken': conn_token,
         'chatEnabled': not data.get('disableChat', False),
         'socketUrl': settings.SOCKJS_SERVER,
         'CURRENT_VERSION': CURRENT_VERSION})


# XXX Obsolete this in favor of GET from wordwalls/api.py
def get_dc_results(user, post, language_code):
    """
        Gets daily challenge results and returns it to querier.
        :post The request.POST dictionary.
    """
    try:
        lex = Lexicon.objects.get(pk=post.get('lexicon'))
    except (Lexicon.DoesNotExist, ValueError):
        raise Http404
    try:
        ch_name = DailyChallengeName.objects.get(pk=post.get('challenge'))
    except (DailyChallengeName.DoesNotExist, ValueError):
        raise Http404
    try:
        if language_code == 'es':
            ch_date = datetime.strptime(post.get('date'), '%d/%m/%Y').date()
        else:
            ch_date = datetime.strptime(post.get('date'), '%m/%d/%Y').date()
    except (ValueError, TypeError):
        ch_date = date.today()
    return response(getLeaderboardData(lex, ch_name, ch_date))


def get_saved_lists(user, post):
    """
        Gets a list of saved lists.
    """
    lex = post.get('lexicon')
    lt = getSavedListList(lex, user)
    return response(lt)


def get_named_lists(user, post):
    """
        Gets a list of "named" lists; these are the default lists that
        come with Aerolith.
    """
    lex = post.get('lexicon')
    lt = getNamedListList(lex)
    return response(lt)


def challenge_submit(user, post):
    """
        Called when a challenge is submitted.
    """
    lexForm = LexiconForm(post)
    dcForm = DailyChallengesForm(post)
    if not(lexForm.is_valid() and dcForm.is_valid()):
        return response({'success': False,
                         'error': _('No challenge was selected.')})
    lex = Lexicon.objects.get(
        lexiconName=lexForm.cleaned_data['lexicon'])
    wwg = WordwallsGame()
    challengeName = DailyChallengeName.objects.get(
        name=dcForm.cleaned_data['challenge'])
    chDate = dcForm.cleaned_data['challengeDate']
    logger.debug('Selected in form: %s, %s, %s',
                 dcForm.cleaned_data['challenge'],
                 dcForm.cleaned_data['challengeDate'],
                 lexForm.cleaned_data['lexicon'])
    if not chDate or chDate > date.today():
        chDate = date.today()

    try:
        tablenum = wwg.initialize_daily_challenge(user, lex, challengeName,
                                                  chDate)
    except GameInitException:
        return response({'success': False,
                         'error': _('Challenge does not exist.')})

    return response(
        {'url': reverse('wordwalls_table',
                        args=(tablenum,)),
         'success': True})


def search_params_submit(user, post):
    """
        Called when user submits a search params query.
    """
    lexForm = LexiconForm(post)
    timeForm = TimeForm(post)
    fwForm = FindWordsForm(post)
    num_q_form = NumQuestionsForm(post)

    # form bound to the POST data
    if not (lexForm.is_valid() and timeForm.is_valid() and fwForm.is_valid()
            and num_q_form.is_valid()):
        return response({'success': False,
                         'error': _('There was something wrong with your '
                                    'search parameters or time selection.')})
    lex = Lexicon.objects.get(
        lexiconName=lexForm.cleaned_data['lexicon'])
    quiz_time = int(round(timeForm.cleaned_data['quizTime'] * 60))
    questions_per_round = num_q_form.cleaned_data['num_questions']
    search = searchForAlphagrams(fwForm.cleaned_data, lex)
    wwg = WordwallsGame()
    tablenum = wwg.initialize_by_search_params(user, search, quiz_time,
                                               questions_per_round)

    return response({'url': reverse('wordwalls_table', args=(tablenum,)),
                     'success': True})


def saved_lists_submit(user, post):
    lexForm = LexiconForm(post)
    timeForm = TimeForm(post)
    slForm = SavedListForm(post)
    num_q_form = NumQuestionsForm(post)
    if not (lexForm.is_valid() and timeForm.is_valid() and slForm.is_valid()
            and num_q_form.is_valid()):
        return response({'success': False,
                         'error': _('Please check that you have selected '
                                    'a word list and a time greater than '
                                    '1 minute.')})

    lex = Lexicon.objects.get(
        lexiconName=lexForm.cleaned_data['lexicon'])
    quizTime = int(
        round(timeForm.cleaned_data['quizTime'] * 60))
    wwg = WordwallsGame()
    try:
        tablenum = wwg.initialize_by_saved_list(
            lex, user, slForm.cleaned_data['wordList'],
            slForm.cleaned_data['listOption'], quizTime,
            num_q_form.cleaned_data['num_questions'])
    except GameInitException:
        raise Http404
    return response({'url': reverse('wordwalls_table',
                                    args=(tablenum,)),
                     'success': True})


def saved_list_delete(user, post):
    lexForm = LexiconForm(post)
    slForm = SavedListForm(post)
    if not (lexForm.is_valid() and slForm.is_valid()):
        return response({'success': False,
                         'error': _('You did not select a list to delete.')})
    deletedListPk = slForm.cleaned_data['wordList'].pk
    deleteSavedList(slForm.cleaned_data['wordList'], user)
    return response({'deleted': True,
                     'wordList': deletedListPk})


def named_lists_submit(user, post):
    lexForm = LexiconForm(post)
    timeForm = TimeForm(post)
    nlForm = NamedListForm(post)
    num_q_form = NumQuestionsForm(post)
    if not (lexForm.is_valid() and timeForm.is_valid() and nlForm.is_valid()
            and num_q_form.is_valid()):
        return response({'success': False,
                         'error': _('Please check that you have selected a '
                                    'list and that your quiz time is greater '
                                    'than 1 minute.')})

    lex = Lexicon.objects.get(
        lexiconName=lexForm.cleaned_data['lexicon'])
    quizTime = int(
        round(timeForm.cleaned_data['quizTime'] * 60))
    wwg = WordwallsGame()
    questions_per_round = num_q_form.cleaned_data['num_questions']
    tablenum = wwg.initialize_by_named_list(
        lex, user, nlForm.cleaned_data['namedList'],
        quizTime, questions_per_round)
    if tablenum == 0:
        raise Http404
    return response({'url': reverse('wordwalls_table',
                                    args=(tablenum,)),
                    'success': True})


def handle_homepage_post(profile, request):
    numAlphas = profile.wordwallsSaveListSize
    limit = 0
    if not profile.member:
        limit = settings.SAVE_LIST_LIMIT_NONMEMBER
    if 'action' not in request.POST:
        return response({'success': False,
                         'error': _('Your request was not successful. You may '
                                    'be using an incompatible browser, please '
                                    'upgrade it.')})
    logger.debug(request.POST)
    # Call one of various functions depending on action.
    actions_dict = {
        'getSavedListList': get_saved_lists,
        'getNamedListList': get_named_lists,
        'getSavedListNumAlphas': lambda x, y: response({'na': numAlphas,
                                                        'l': limit}),
        'challengeSubmit': challenge_submit,
        'searchParamsSubmit': search_params_submit,
        'savedListsSubmit': saved_lists_submit,
        'savedListDelete': saved_list_delete,
        'namedListsSubmit': named_lists_submit
    }
    if request.POST['action'] == 'getDcResults':
        return get_dc_results(request.user, request.POST,
                              request.LANGUAGE_CODE)
    return actions_dict[request.POST['action']](request.user, request.POST)


@login_required
def table(request, id):
    if request.method == 'POST':
        action = request.POST['action']
        logger.debug(u'user=%s, action=%s, table=%s', request.user, action, id)
        if action == "start":
            return start_game(request, id)
        elif action == "guess":
            logger.debug(u'guess=%s', request.POST['guess'])
            wwg = WordwallsGame()
            state = wwg.guess(request.POST['guess'].strip(), id, request.user)
            if state is None:
                return response(_('Quiz is already over.'),
                                status=StatusCode.BAD_REQUEST)
            logger.debug(u'table=%s Returning %s', id, state)
            return response({'g': state['going'], 'C': state['alphagram'],
                             'w': state['word'],
                             'a': state['already_solved']})
        elif action == "gameEnded":
            wwg = WordwallsGame()
            ret = wwg.check_game_ended(id)
            # 'going' is the opposite of 'game ended'
            return response({'g': not ret})
        elif action == "giveUp":
            wwg = WordwallsGame()
            ret = wwg.give_up(request.user, id)
            return response({'g': not ret})
        elif action == "save":
            wwg = WordwallsGame()
            ret = wwg.save(request.user, id, request.POST['listname'])
            return response(ret)
        elif action == "giveUpAndSave":
            wwg = WordwallsGame()
            ret = wwg.give_up_and_save(request.user, id,
                                       request.POST['listname'])
            # this shouldn't return a response, because it's not going to be
            # caught by the javascript
            logger.debug("Give up and saving returned: %s" % ret)
            return response(ret)
        elif action == "savePrefs":
            profile = request.user.aerolithprofile
            profile.customWordwallsStyle = request.POST['prefs']
            profile.save()
            return response({'success': True})
        elif action == "getDcData":
            wwg = WordwallsGame()
            dcId = wwg.get_dc_id(id)
            if dcId > 0:
                leaderboardData = getLeaderboardDataDcInstance(
                    DailyChallenge.objects.get(pk=dcId))
                return response(leaderboardData)
        else:
            return response({'success': False},
                            status=StatusCode.BAD_REQUEST)

    else:   # it's a GET
        wwg = WordwallsGame()
        permitted = wwg.permit(request.user, id)
        if gargoyle.is_active('disable_games', request):
            permitted = False
        if not permitted:
            return render(request, 'wordwalls/notPermitted.html',
                          {'tablenum': id})
        params = wwg.get_add_params(id)
        # Add styling params from user's profile (for styling table
        # tiles, backgrounds, etc)
        profile = request.user.aerolithprofile
        style = profile.customWordwallsStyle
        if style != "":
            params['style'] = style

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

        return render(request, 'wordwalls/table.html',
                      {'tablenum': id,
                       'username': request.user.username,
                       'addParams': json.dumps(params),
                       'avatarUrl': profile.avatarUrl,
                       'CURRENT_VERSION': CURRENT_VERSION,
                       'lexicon': wwg.get_wgm(id, False).lexicon,
                       'default_lexicon': profile.defaultLexicon.pk,
                       'challenge_info': json.dumps(challenge_info),
                       'available_lexica': json.dumps(lexica),
                       })


def start_game(request, id):
    if gargoyle.is_active('disable_games', request):
        return response(
            {'serverMsg': _(
                'The Aerolith server is currently undergoing '
                'maintenance. Please try again in a few minutes.')})
    wwg = WordwallsGame()
    quiz_params = wwg.start_quiz(id, request.user)
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
        return False, _("This list would exceed your total list size limit")
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


def searchForAlphagrams(data, lex):
    """ Searches for alphagrams using form data """
    length = int(data['wordLength'])
    return SearchDescription.probability_range(data['probabilityMin'],
                                               data['probabilityMax'],
                                               length, lex)


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


def getSavedListList(lex, user):
    try:
        lex_object = Lexicon.objects.get(lexiconName=lex)
    except Lexicon.DoesNotExist:
        return []

    qset = WordList.objects.filter(
        lexicon=lex_object, user=user,
        is_temporary=False).order_by('-lastSaved')
    retData = []
    now = datetime.now()
    for sl in qset:
        retData.append({'name': sl.name,
                        'lastSaved': pretty_date(now, sl.lastSaved),
                        'lexicon': sl.lexicon.lexiconName,
                        'goneThruOnce': sl.goneThruOnce,
                        'pk': sl.pk,
                        'numAlphas': sl.numAlphagrams})

    return retData


def getNamedListList(lex):
    try:
        lex_object = Lexicon.objects.get(lexiconName=lex)
    except Lexicon.DoesNotExist:
        return []
    qset = NamedList.objects.filter(lexicon=lex_object).order_by('pk')
    retData = []
    for nl in qset:
        retData.append({'name': nl.name,
                        'lexicon': nl.lexicon.lexiconName,
                        'numAlphas': nl.numQuestions, 'pk': nl.pk})

    return retData


def deleteSavedList(savedList, user):
    if savedList.user != user:
        return

    numAlphagrams = savedList.numAlphagrams
    savedList.delete()
    profile = user.aerolithprofile
    profile.wordwallsSaveListSize -= numAlphagrams
    profile.save()
    return profile.wordwallsSaveListSize


@login_required
def mark_missed(request, id):
    wwg = WordwallsGame()
    marked = wwg.mark_missed(request.POST['idx'], id, request.user)
    return response({'success': marked})
