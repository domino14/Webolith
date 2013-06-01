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
from django.shortcuts import render_to_response
from forms import (FindWordsForm, DailyChallengesForm, UserListForm,
                   SavedListForm, LexiconForm, TimeForm, NamedListForm)
from django.template import RequestContext
from base.models import Lexicon, Alphagram, Word, alphProbToProbPK
from django.contrib.auth.decorators import login_required
import json
from wordwalls.game import WordwallsGame, SearchDescription
from django.core.urlresolvers import reverse
from django.http import HttpResponse, HttpResponseBadRequest
from wordwalls.models import (DailyChallenge, DailyChallengeLeaderboard,
                              DailyChallengeLeaderboardEntry)
from wordwalls.models import (SavedList, DailyChallengeName,
                              WordwallsGameModel, NamedList)
from datetime import date, datetime, timedelta
import time
from django.conf import settings

import wordwalls.settings
import os
from locks import lonelock
from django.middleware.csrf import get_token
import random
import logging
from lib.response import response
from wordwalls.utils import get_alphas_from_words, get_pks_from_alphas
from djAerolith.views import get_random_title
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
    profile = request.user.get_profile()

    if request.method == 'POST':
        return handle_homepage_post(profile, request)

    lengthCounts = dict([(l.lexiconName, l.lengthCounts)
                        for l in Lexicon.objects.all()])

    ctx = RequestContext(request, {'csrf_token': get_token(request)})

    return render_to_response(
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
        'image_title': get_random_title()},
        context_instance=ctx)


def handle_homepage_post(profile, request):
    numAlphas = profile.wordwallsSaveListSize
    limit = 0
    if not profile.member:
        limit = wordwalls.settings.SAVE_LIST_LIMIT_NONMEMBER
    if 'action' in request.POST:
        logger.debug(request.POST)
        if request.POST['action'] == 'getDcResults':
            try:
                lex = request.POST['lexicon']
                chName = DailyChallengeName.objects.get(
                    name=request.POST['chName'])
                try:
                    chDate = datetime.strptime(request.POST['date'],
                                               '%m/%d/%Y').date()
                except:
                    chDate = date.today()

                leaderboardData = getLeaderboardData(lex, chName, chDate)
                return response(leaderboardData)
            except:
                raise Http404
        elif request.POST['action'] == 'getSavedListList':
            # gets a list of saved lists!
            try:
                lex = request.POST['lexicon']
                lt = getSavedListList(lex, request.user)
                return response(lt)
            except:
                raise Http404
        elif request.POST['action'] == 'getNamedListList':
            # gets a list of saved lists!
            try:
                lex = request.POST['lexicon']
                lt = getNamedListList(lex)
                return response(lt)
            except:
                raise Http404

        elif request.POST['action'] == 'getSavedListNumAlphas':
            return response({'na': numAlphas, 'l': limit})

        elif request.POST['action'] == 'challengeSubmit':
            lexForm = LexiconForm(request.POST)
            dcForm = DailyChallengesForm(request.POST)
            if lexForm.is_valid() and dcForm.is_valid():
                lex = Lexicon.objects.get(
                    lexiconName=lexForm.cleaned_data['lexicon'])
                wwg = WordwallsGame()
                challengeName = DailyChallengeName.objects.get(
                    name=dcForm.cleaned_data['challenge'])
                chDate = dcForm.cleaned_data['challengeDate']
                if not chDate or chDate > date.today():
                    chDate = date.today()

                tablenum = wwg.initializeByDailyChallenge(
                    request.user, lex, challengeName, chDate)
                if tablenum == 0:
                    return response({'success': False,
                                     'error': 'Challenge does not exist.'})
                else:
                    return response(
                        {'url': reverse('wordwalls_table',
                                        args=(tablenum,)),
                         'success': True})

        elif request.POST['action'] == 'searchParamsSubmit':
            lexForm = LexiconForm(request.POST)
            timeForm = TimeForm(request.POST)
            fwForm = FindWordsForm(request.POST)
            print lexForm.is_valid(), timeForm.is_valid(), fwForm.is_valid()
            # form bound to the POST data
            if (lexForm.is_valid() and timeForm.is_valid() and
                    fwForm.is_valid()):
                lex = Lexicon.objects.get(
                    lexiconName=lexForm.cleaned_data['lexicon'])
                quizTime = int(
                    round(timeForm.cleaned_data['quizTime'] * 60))
                alphasSearchDescription = searchForAlphagrams(
                    fwForm.cleaned_data, lex)
                wwg = WordwallsGame()
                tablenum = wwg.initializeBySearchParams(
                    request.user, alphasSearchDescription,
                    fwForm.cleaned_data['playerMode'], quizTime)

                return response({'url': reverse('wordwalls_table',
                                                args=(tablenum,)),
                                 'success': True})

        elif request.POST['action'] == 'savedListsSubmit':
            lexForm = LexiconForm(request.POST)
            timeForm = TimeForm(request.POST)
            slForm = SavedListForm(request.POST)
            if (lexForm.is_valid() and timeForm.is_valid() and
                    slForm.is_valid()):
                lex = Lexicon.objects.get(
                    lexiconName=lexForm.cleaned_data['lexicon'])
                quizTime = int(
                    round(timeForm.cleaned_data['quizTime'] * 60))
                wwg = WordwallsGame()
                tablenum = wwg.initializeBySavedList(
                    lex, request.user, slForm.cleaned_data['wordList'],
                    slForm.cleaned_data['listOption'], quizTime)
                if tablenum == 0:
                    raise Http404
                else:
                    return response({'url': reverse('wordwalls_table',
                                                    args=(tablenum,)),
                                     'success': True})

        elif request.POST['action'] == 'savedListDelete':
            lexForm = LexiconForm(request.POST)
            slForm = SavedListForm(request.POST)
            if lexForm.is_valid() and slForm.is_valid():
                deletedListPk = slForm.cleaned_data['wordList'].pk
                deleteSavedList(slForm.cleaned_data['wordList'],
                                request.user)

                return response({'deleted': True,
                                 'wordList': deletedListPk})

        elif request.POST['action'] == 'namedListsSubmit':
            lexForm = LexiconForm(request.POST)
            timeForm = TimeForm(request.POST)
            nlForm = NamedListForm(request.POST)
            if (lexForm.is_valid() and timeForm.is_valid() and
                    nlForm.is_valid()):
                lex = Lexicon.objects.get(
                    lexiconName=lexForm.cleaned_data['lexicon'])
                quizTime = int(
                    round(timeForm.cleaned_data['quizTime'] * 60))
                wwg = WordwallsGame()
                tablenum = wwg.initializeByNamedList(
                    lex, request.user, nlForm.cleaned_data['namedList'],
                    quizTime)
                if tablenum == 0:
                    raise Http404
                else:
                    return response({'url': reverse('wordwalls_table',
                                                    args=(tablenum,)),
                                    'success': True})



@login_required
def table(request, id):
    logger.info("request: %s", request.method)

    if request.method == 'POST':
        action = request.POST['action']
        logger.info('action %s', action)
        if action == "start":
            return start_game(request, id)
        elif action == "guess":
            lonelock(WordwallsGameModel, id)
            logger.info('%s: guess %s, table %s', request.user.username,
                        request.POST['guess'], id)

            wwg = WordwallsGame()

            state = wwg.guess(request.POST['guess'].strip(), id, request.user)

            # wgm2 = WordwallsGameModel.objects.get(pk=id)
            #             newState = json.loads(wgm2.currentGameState)
            return response({'g': state[0], 'C': state[1]})
        elif action == "gameEnded":
            lonelock(WordwallsGameModel, id)
            wwg = WordwallsGame()
            ret = wwg.checkGameEnded(id)
            # 'going' is the opposite of 'game ended'
            return response({'g': not ret})
        elif action == "giveUp":
            lonelock(WordwallsGameModel, id)
            wwg = WordwallsGame()
            ret = wwg.giveUp(request.user, id)
            return response({'g': not ret})
        elif action == "save":
            lonelock(WordwallsGameModel, id)
            wwg = WordwallsGame()
            ret = wwg.save(request.user, id, request.POST['listname'])
            return response(ret)
        elif action == "giveUpAndSave":
            lonelock(WordwallsGameModel, id)
            wwg = WordwallsGame()
            ret = wwg.giveUpAndSave(request.user, id, request.POST['listname'])
            # this shouldn't return a response, because it's not going to be
            # caught by the javascript
            logger.debug("Give up and saving returned: %s" % ret)
            return response(ret)
        elif action == "savePrefs":
            profile = request.user.get_profile()
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
        if permitted:
            params = wwg.getAddParams(id)
            # Add styling params from user's profile (for styling table
            # tiles, backgrounds, etc)
            try:
                profile = request.user.get_profile()
                style = profile.customWordwallsStyle
                if style != "":
                    params['style'] = style
            except:
                pass

            return render_to_response('wordwalls/table.html',
                                      {'tablenum': id,
                                       'username': request.user.username,
                                       'addParams': json.dumps(params),
                                       'avatarUrl': profile.avatarUrl},
                                      context_instance=RequestContext(request))
        else:
            return render_to_response('wordwalls/notPermitted.html',
                                      {'tablenum': id})


def start_game(request, id):
    lonelock(WordwallsGameModel, id)
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

    profile = user.get_profile()
    numSavedAlphas = profile.wordwallsSaveListSize
    limit = wordwalls.settings.SAVE_LIST_LIMIT_NONMEMBER

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
            return  "a minute ago"
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
    except:
        return None

    try:
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
    except:
        return None


def getNamedListList(lex):
    try:
        lex_object = Lexicon.objects.get(lexiconName=lex)
    except:
        return None
    try:
        qset = NamedList.objects.filter(lexicon=lex_object).order_by('pk')
        retData = []
        for nl in qset:
            retData.append({'name': nl.name,
                            'lexicon': nl.lexicon.lexiconName,
                            'numAlphas': nl.numQuestions, 'pk': nl.pk})

        return retData
    except:
        return None


def deleteSavedList(savedList, user):
    if savedList.user != user:
        return

    numAlphagrams = savedList.numAlphagrams
    savedList.delete()
    profile = user.get_profile()
    profile.wordwallsSaveListSize -= numAlphagrams
    profile.save()
    return profile.wordwallsSaveListSize


######################
# api views
def api_challengers(request, month, day, year, lex, ch_id):
    # the people who have done daily challenges
    # used to test a certain pull api :P
    rows = challengers(month, day, year, lex, ch_id)
    return HttpResponse(json.dumps({"table": rows}))


def api_challengers_days_from_today(request, days, lex, ch_id):
    day = date.today() - timedelta(days=int(days))
    rows = challengers(day.month, day.day, day.year, lex, ch_id)
    return HttpResponse(json.dumps({"table": rows}))


def api_num_tables_created(request):
    allGames = WordwallsGameModel.objects.all().reverse()[:1]
    numTables = allGames[0].pk
    return HttpResponse(
        json.dumps({"number": numTables, "timestamp": time.time()}))


def api_random_toughie(request):
    from wordwalls.management.commands.genMissedBingoChalls import (
        challengeDateFromReqDate)
    # from the PREVIOUS toughies challenge
    chdate = challengeDateFromReqDate(date.today()) - timedelta(days=7 * 20)
    dc = DailyChallenge.objects.get(
        lexicon=Lexicon.objects.get(pk=4),
        date=chdate,
        name=DailyChallengeName.objects.get(
            name=DailyChallengeName.WEEKS_BINGO_TOUGHIES))
    alphs = json.loads(dc.alphagrams)

    alpha = Alphagram.objects.get(pk=random.choice(alphs))
    words = Word.objects.filter(alphagram=alpha)
    wordString = " ".join([word.word for word in words])
    alphaString = alpha.alphagram
    html = """
    <script>
    $("#toughie").hover(function() {
        $(this).text("%s");
    },
    function() {
        $(this).text("%s");
    });</script>
    <div id="toughie" style="font-size: 32px;">%s</div>
    """ % (wordString, alphaString, alphaString)

    alphagram = json.dumps({"html": html})

    return HttpResponse(alphagram)
# api views helpers


def challengers(month, day, year, lex, ch_id):
    rows = [['User', 'Score', 'Time remaining']]
    try:
        lex = Lexicon.objects.get(pk=lex).lexiconName
        chName = DailyChallengeName.objects.get(pk=ch_id)
        chDate = date(day=int(day), month=int(month), year=int(year))

        data = getLeaderboardData(lex, chName, chDate)
    except:
        import traceback
        print traceback.format_exc()

    try:
        maxScore = data['maxScore']
        for entry in data['entries']:
            user = entry['user']
            score = '%.1f%%' % (
                100 * (float(entry['score']) / float(maxScore)))
            tr = entry['tr']
            rows.append([user, score, tr])

    except:
        pass
    return rows
