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
from django.http import Http404
from django.shortcuts import render
from forms import TimeForm, DailyChallengesForm
from base.forms import (FindWordsForm, UserListForm, SavedListForm,
                        LexiconForm, NamedListForm)
from base.models import Lexicon, alphProbToProbPK, SavedList
from django.contrib.auth.decorators import login_required
import json
from wordwalls.game import WordwallsGame, SearchDescription
from django.core.urlresolvers import reverse
from django.http import HttpResponse, HttpResponseBadRequest
from wordwalls.models import (DailyChallenge, DailyChallengeLeaderboard,
                              DailyChallengeLeaderboardEntry)
from wordwalls.models import (DailyChallengeName, NamedList)
from datetime import date, datetime
import time
from django.conf import settings
import wordwalls.settings
import base.settings
import os
import random
import logging
from lib.response import response, StatusCode
from lib.socket_helper import get_connection_token
from wordwalls.utils import get_alphas_from_words, get_pks_from_alphas
from current_version import CURRENT_VERSION
from wordwalls.utils import UserListParseException
from gargoyle import gargoyle


dcTimeMap = {}
for i in DailyChallengeName.objects.all():
    dcTimeMap[i.pk] = i.timeSecs

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
         'dcTimes': json.dumps(dcTimeMap),
         'defaultLexicon': profile.defaultLexicon,
         # 'connToken': conn_token,
         'chatEnabled': not data.get('disableChat', False),
         'socketUrl': settings.SOCKJS_SERVER,
         'CURRENT_VERSION': CURRENT_VERSION})


def get_dc_results(user, post):
    """
        Gets daily challenge results and returns it to querier.
        :post The request.POST dictionary.
    """
    lex = post.get('lexicon')
    try:
        ch_name = DailyChallengeName.objects.get(name=post.get('chName'))
    except DailyChallengeName.DoesNotExist:
        raise Http404
    try:
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
                         'error': 'No challenge was selected.'})
    lex = Lexicon.objects.get(
        lexiconName=lexForm.cleaned_data['lexicon'])
    wwg = WordwallsGame()
    challengeName = DailyChallengeName.objects.get(
        name=dcForm.cleaned_data['challenge'])
    chDate = dcForm.cleaned_data['challengeDate']
    if not chDate or chDate > date.today():
        chDate = date.today()

    tablenum = wwg.initializeByDailyChallenge(
        user, lex, challengeName, chDate)
    if tablenum == 0:
        return response({'success': False,
                         'error': 'Challenge does not exist.'})

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
    # form bound to the POST data
    if not (lexForm.is_valid() and timeForm.is_valid() and fwForm.is_valid()):
        return response({'success': False,
                         'error': 'There was something wrong with your '
                                  'search parameters or time selection.'})
    lex = Lexicon.objects.get(
        lexiconName=lexForm.cleaned_data['lexicon'])
    quizTime = int(
        round(timeForm.cleaned_data['quizTime'] * 60))
    alphasSearchDescription = searchForAlphagrams(
        fwForm.cleaned_data, lex)
    wwg = WordwallsGame()
    tablenum = wwg.initializeBySearchParams(
        user, alphasSearchDescription,
        quizTime)

    return response({'url': reverse('wordwalls_table',
                                    args=(tablenum,)),
                     'success': True})


def saved_lists_submit(user, post):
    lexForm = LexiconForm(post)
    timeForm = TimeForm(post)
    slForm = SavedListForm(post)
    if not (lexForm.is_valid() and timeForm.is_valid() and slForm.is_valid()):
        return response({'success': False,
                         'error': 'Please check that you have selected '
                                  'a word list and a time greater than '
                                  '1 minute.'})

    lex = Lexicon.objects.get(
        lexiconName=lexForm.cleaned_data['lexicon'])
    quizTime = int(
        round(timeForm.cleaned_data['quizTime'] * 60))
    wwg = WordwallsGame()
    tablenum = wwg.initializeBySavedList(
        lex, user, slForm.cleaned_data['wordList'],
        slForm.cleaned_data['listOption'], quizTime)
    if tablenum == 0:
        raise Http404
    return response({'url': reverse('wordwalls_table',
                                    args=(tablenum,)),
                     'success': True})


def saved_list_delete(user, post):
    lexForm = LexiconForm(post)
    slForm = SavedListForm(post)
    if not (lexForm.is_valid() and slForm.is_valid()):
        return response({'success': False,
                         'error': 'You did not select a list to delete.'})
    deletedListPk = slForm.cleaned_data['wordList'].pk
    deleteSavedList(slForm.cleaned_data['wordList'], user)
    return response({'deleted': True,
                     'wordList': deletedListPk})


def named_lists_submit(user, post):
    lexForm = LexiconForm(post)
    timeForm = TimeForm(post)
    nlForm = NamedListForm(post)
    if not (lexForm.is_valid() and timeForm.is_valid() and nlForm.is_valid()):
        return response({'success': False,
                         'error': 'Please check that you have selected a '
                                  'list and that your quiz time is greater '
                                  'than 1 minute.'})

    lex = Lexicon.objects.get(
        lexiconName=lexForm.cleaned_data['lexicon'])
    quizTime = int(
        round(timeForm.cleaned_data['quizTime'] * 60))
    wwg = WordwallsGame()
    tablenum = wwg.initializeByNamedList(
        lex, user, nlForm.cleaned_data['namedList'],
        quizTime)
    if tablenum == 0:
        raise Http404
    return response({'url': reverse('wordwalls_table',
                                    args=(tablenum,)),
                    'success': True})


def handle_homepage_post(profile, request):
    numAlphas = profile.wordwallsSaveListSize
    limit = 0
    if not profile.member:
        limit = base.settings.SAVE_LIST_LIMIT_NONMEMBER
    if 'action' not in request.POST:
        return response({'success': False,
                         'error': 'Your request was not successful. You may '
                                  'be using an incompatible browser, please '
                                  'upgrade it.'})
    logger.debug(request.POST)
    # Call one of various functions depending on action.
    actions_dict = {
        'getDcResults': get_dc_results,
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
    return actions_dict[request.POST['action']](request.user, request.POST)


@login_required
def table(request, id):
    if request.method == 'POST':
        action = request.POST['action']
        logger.debug('user=%s, action=%s, table=%s', request.user, action, id)
        if action == "start":
            return start_game(request, id)
        elif action == "guess":
            logger.debug('guess=%s', request.POST['guess'])
            wwg = WordwallsGame()
            state = wwg.guess(request.POST['guess'].strip(), id, request.user)
            if state is None:
                return response('Quiz is already over.',
                                status=StatusCode.BAD_REQUEST)
            return response({'g': state[0], 'C': state[1]})
        elif action == "gameEnded":
            wwg = WordwallsGame()
            ret = wwg.checkGameEnded(id)
            # 'going' is the opposite of 'game ended'
            return response({'g': not ret})
        elif action == "giveUp":
            wwg = WordwallsGame()
            ret = wwg.giveUp(request.user, id)
            return response({'g': not ret})
        elif action == "save":
            wwg = WordwallsGame()
            ret = wwg.save(request.user, id, request.POST['listname'])
            return response(ret)
        elif action == "giveUpAndSave":
            wwg = WordwallsGame()
            ret = wwg.giveUpAndSave(request.user, id, request.POST['listname'])
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
            dcId = wwg.getDcId(id)
            if dcId > 0:
                leaderboardData = getLeaderboardDataDcInstance(
                    DailyChallenge.objects.get(pk=dcId))
                return response(leaderboardData)

    else:   # it's a GET
        wwg = WordwallsGame()
        permitted = wwg.permit(request.user, id)
        if gargoyle.is_active('disable_games', request):
            permitted = False
        if permitted:
            params = wwg.getAddParams(id)
            # Add styling params from user's profile (for styling table
            # tiles, backgrounds, etc)
            try:
                profile = request.user.aerolithprofile
                style = profile.customWordwallsStyle
                if style != "":
                    params['style'] = style
            except:
                pass

            return render(request, 'wordwalls/table.html',
                          {'tablenum': id,
                           'username': request.user.username,
                           'addParams': json.dumps(params),
                           'avatarUrl': profile.avatarUrl,
                           'CURRENT_VERSION': CURRENT_VERSION
                           })

        else:
            return render(request, 'wordwalls/notPermitted.html',
                          {'tablenum': id})


def start_game(request, id):
    if gargoyle.is_active('disable_games', request):
        return response(
            {'serverMsg': 'The Aerolith server is currently undergoing '
                          'maintenance. Please try again in a few minutes.'})
    wwg = WordwallsGame()
    gameReady = wwg.startRequest(request.user, id)
    if not gameReady:
        return response({"serverMsg": request.user.username})
    else:
        quizParams = wwg.startQuiz(id, request.user)
        return response(quizParams)


def ajax_upload(request):
    if request.method == "POST":
        lexForm = LexiconForm(request.GET)
        if lexForm.is_valid():
            lex = Lexicon.objects.get(
                lexiconName=lexForm.cleaned_data['lexicon'])
        else:
            raise Http404("Bad lexicon")
        if request.is_ajax():
            # the file is stored raw in the request
            upload = request
            # AJAX Upload will pass the filename in the querystring if
            # it is the "advanced" ajax upload
            try:
                filename = request.GET['qqfile']
            except KeyError:
                return HttpResponseBadRequest("AJAX request not valid")
            # Not an ajax upload, so it was the "basic" iframe version
            # with submission via form
        else:
            if len(request.FILES) == 1:
                # FILES is a dictionary in Django but Ajax Upload gives
                # the uploaded file an ID based on a random number, so
                # it cannot be guessed here in the code. Rather than
                # editing Ajax Upload to pass the ID in the querystring,
                # observe that each upload is a separate request, so
                # FILES should only have one entry. Thus, we can just
                # grab the first (and only) value in the dict.
                upload = request.FILES.values()[0]
            else:
                raise Http404("Bad Upload")
            filename = upload.name

      # save the file
        success, msg = createUserList(upload, filename, lex, request.user)

        # let Ajax Upload know whether we saved it or not

        ret_json = {'success': success,
                    'msg': msg}
        return HttpResponse(json.dumps(ret_json))


def createUserList(upload, filename, lex, user):
    filename_stripped, extension = os.path.splitext(filename)
    try:
        SavedList.objects.get(name=filename_stripped, user=user, lexicon=lex)
        # uh oh, it exists!
        return (False, "A list by the name %s already exists for this "
                       "lexicon! Please rename your file." % filename_stripped)
    except:
        pass
    t1 = time.time()
    try:
        alphaSet = get_alphas_from_words(upload)
    except UserListParseException as e:
        return (False, str(e))

    profile = user.aerolithprofile
    numSavedAlphas = profile.wordwallsSaveListSize
    limit = base.settings.SAVE_LIST_LIMIT_NONMEMBER

    if (numSavedAlphas + len(alphaSet)) > limit and not profile.member:
        return False, "This list would exceed your total list size limit"

    pkList, addlMsg = get_pks_from_alphas(alphaSet, lex.pk)
    numAlphagrams = len(pkList)
    random.shuffle(pkList)
    logger.info('number of uploaded alphagrams: %d', numAlphagrams)
    logger.info('elapsed time: %f', time.time() - t1)
    logger.info('user: %s, filename: %s', user.username, filename)

    sl = SavedList(lexicon=lex, name=filename_stripped, user=user,
                   numAlphagrams=numAlphagrams, numCurAlphagrams=numAlphagrams,
                   numFirstMissed=0, numMissed=0, goneThruOnce=False,
                   questionIndex=0, origQuestions=json.dumps(pkList),
                   curQuestions=json.dumps(range(numAlphagrams)),
                   missed=json.dumps([]), firstMissed=json.dumps([]))
    try:
        sl.save()
    except:
        return False, "Unable to save list!"

    profile.wordwallsSaveListSize += numAlphagrams
    profile.save()

    return True, addlMsg


def searchForAlphagrams(data, lex):
    """ searches for alphagrams using form data """
    length = int(data['wordLength'])
    minP = alphProbToProbPK(data['probabilityMin'], lex.pk, length)
    maxP = alphProbToProbPK(data['probabilityMax'], lex.pk, length)
    return SearchDescription.probPkIndexRange(minP, maxP, lex)


def getLeaderboardDataDcInstance(dc):
    try:
        lb = DailyChallengeLeaderboard.objects.get(challenge=dc)
    except:
        return None

    lbes = DailyChallengeLeaderboardEntry.objects.filter(board=lb)
    retData = {'maxScore': lb.maxScore, 'entries': []}

    entries = []
    for lbe in lbes:
        entry = {'user': lbe.user.username,
                 'score': lbe.score, 'tr': lbe.timeRemaining,
                 'addl': lbe.additionalData}
        entries.append(entry)

    def cmpFunction(e1, e2):
        if e1['score'] != e2['score']:
            return int(e2['score'] - e1['score'])
        else:
            return int(e2['tr'] - e1['tr'])

    entries = sorted(entries, cmpFunction)
    retData['entries'] = entries

    return retData


def getLeaderboardData(lex, chName, challengeDate):
    try:
        lex_object = Lexicon.objects.get(lexiconName=lex)
    except:
        return None

    if chName.name == DailyChallengeName.WEEKS_BINGO_TOUGHIES:
        from wordwalls.management.commands.genMissedBingoChalls import (
            challengeDateFromReqDate)
        chdate = challengeDateFromReqDate(challengeDate)
    else:
        chdate = challengeDate
    try:
        dc = DailyChallenge.objects.get(lexicon=lex_object, date=chdate,
                                        name=chName)
    except:
        return None  # daily challenge doesn't exist

    return getLeaderboardDataDcInstance(dc)


def pretty_date(now, time):
    """
    Get a datetime object and return a
    pretty string like 'an hour ago', 'Yesterday', '3 months ago',
    'just now', etc
    """

    diff = now - time
    second_diff = diff.seconds
    day_diff = diff.days

    if day_diff < 0:
        return ''

    if day_diff == 0:
        if second_diff < 10:
            return "just now"
        if second_diff < 60:
            return str(second_diff) + " seconds ago"
        if second_diff < 120:
            return "a minute ago"
        if second_diff < 3600:
            return str(second_diff / 60) + " minutes ago"
        if second_diff < 7200:
            return "an hour ago"
        if second_diff < 86400:
            return str(second_diff / 3600) + " hours ago"
    if day_diff == 1:
        return "Yesterday"
    if day_diff < 7:
        return str(day_diff) + " days ago"
    if day_diff < 31:
        return str(day_diff / 7) + " weeks ago"
    if day_diff < 365:
        return str(day_diff / 30) + " months ago"
    return str(day_diff / 365) + " years ago"


def getSavedListList(lex, user):
    try:
        lex_object = Lexicon.objects.get(lexiconName=lex)
    except Lexicon.DoesNotExist:
        return []

    qset = SavedList.objects.filter(
        lexicon=lex_object, user=user).order_by('-lastSaved')
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


def mark_missed(request, id):
    wwg = WordwallsGame()
    marked = wwg.mark_missed(request.POST['idx'], id, request.user)
    return response({'success': marked})
