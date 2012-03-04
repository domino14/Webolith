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
from forms import FindWordsForm, DailyChallengesForm, UserListForm, SavedListForm, LexiconForm, TimeForm, NamedListForm
from django.template import RequestContext
from base.models import Lexicon, Alphagram, Word, alphProbToProbPK
from django.contrib.auth.decorators import login_required
import json
from wordwalls.game import WordwallsGame, SearchDescription
from django.core.urlresolvers import reverse
from django.http import HttpResponseRedirect, HttpResponse
from wordwalls.models import DailyChallenge, DailyChallengeLeaderboard, DailyChallengeLeaderboardEntry
from wordwalls.models import SavedList, DailyChallengeName, WordwallsGameModel, NamedList
from datetime import date, datetime
import sys
import time
from django.conf import settings

import wordwalls.settings
import os
from locks import lonelock, loneunlock
from django.middleware.csrf import get_token
from base.models import alphagrammize
import random
import redis
import logging
dcTimeMap = {}
for i in DailyChallengeName.objects.all():
    dcTimeMap[i.pk] = i.timeSecs
    
logger = logging.getLogger("apps")

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
    numAlphas = profile.wordwallsSaveListSize
    limit = 0
    if not profile.member:
        limit = wordwalls.settings.SAVE_LIST_LIMIT_NONMEMBER
    
    if request.method == 'POST':                
        if 'action' in request.POST:
            logger.info(request.POST['action'])
            if request.POST['action'] == 'getDcResults':
                try:
                    lex = request.POST['lexicon']
                    chName = DailyChallengeName.objects.get(name=request.POST['chName'])
                    leaderboardData = getLeaderboardData(lex, chName)
                    response = HttpResponse(json.dumps(leaderboardData, ensure_ascii=False), 
                                            mimetype="application/javascript")
                    response['Content-Type'] = 'text/plain; charset=utf-8'
                    return response
                except:
                    raise Http404
            elif request.POST['action'] == 'getSavedListList':
                # gets a list of saved lists!
                try:
                    lex = request.POST['lexicon']
                    lt = getSavedListList(lex, request.user)
                    #print lt
                    response = HttpResponse(json.dumps(lt, ensure_ascii=False), 
                                            mimetype="application/javascript")
                    response['Content-Type'] = 'text/plain; charset=utf-8'
                    return response
                
                except:
                    raise Http404
            elif request.POST['action'] == 'getNamedListList':
                # gets a list of saved lists!
                try:
                    lex = request.POST['lexicon']
                    lt = getNamedListList(lex)
                    #print lt
                    response = HttpResponse(json.dumps(lt, ensure_ascii=False), 
                                            mimetype="application/javascript")
                    response['Content-Type'] = 'text/plain; charset=utf-8'
                    return response
                
                except:
                    raise Http404
                
                
            elif request.POST['action'] == 'getSavedListNumAlphas':
                response = HttpResponse(json.dumps({'na': numAlphas, 'l': limit}), mimetype="application/javascript")
                response['Content-Type'] = 'text/plain; charset=utf-8'
                return response
                
            elif request.POST['action'] == 'challengeSubmit':
                lexForm = LexiconForm(request.POST)
                dcForm = DailyChallengesForm(request.POST)
                
                if lexForm.is_valid() and dcForm.is_valid():
                    lex = Lexicon.objects.get(lexiconName=lexForm.cleaned_data['lexicon'])
                    wwg = WordwallsGame()
                    challengeName = DailyChallengeName.objects.get(name=dcForm.cleaned_data['challenge'])
                    tablenum = wwg.initializeByDailyChallenge(request.user, lex, challengeName)
                    if tablenum == 0:
                        raise Http404
                    else:
                        response = HttpResponse(json.dumps(
                                                            {'url': reverse('wordwalls_table', args=(tablenum,)),
                                                            'success': True}
                                                            ),
                                                            mimetype="application/javascript")
                        response['Content-Type'] = 'text/plain; charset=utf-8'
                        return response
            
            elif request.POST['action'] == 'searchParamsSubmit':
                lexForm = LexiconForm(request.POST)
                timeForm = TimeForm(request.POST)
                fwForm = FindWordsForm(request.POST)   # form bound to the POST data
                if lexForm.is_valid() and timeForm.is_valid() and fwForm.is_valid():
                    lex = Lexicon.objects.get(lexiconName=lexForm.cleaned_data['lexicon'])
                    quizTime = int(round(timeForm.cleaned_data['quizTime'] * 60))
                    alphasSearchDescription = searchForAlphagrams(fwForm.cleaned_data, lex)
                    wwg = WordwallsGame()
                    tablenum = wwg.initializeBySearchParams(request.user, alphasSearchDescription, 
                                    fwForm.cleaned_data['playerMode'], quizTime)

                    response = HttpResponse(json.dumps(
                                                        {'url': reverse('wordwalls_table', args=(tablenum,)),
                                                        'success': True}
                                                        ),
                                                        mimetype="application/javascript")
                    response['Content-Type'] = 'text/plain; charset=utf-8'
                    return response
                
            elif request.POST['action'] == 'savedListsSubmit':
                lexForm = LexiconForm(request.POST)
                timeForm = TimeForm(request.POST)
                slForm = SavedListForm(request.POST)
                if lexForm.is_valid() and timeForm.is_valid() and slForm.is_valid():           
                    lex = Lexicon.objects.get(lexiconName=lexForm.cleaned_data['lexicon'])
                    quizTime = int(round(timeForm.cleaned_data['quizTime'] * 60))
                    wwg = WordwallsGame()
                    tablenum = wwg.initializeBySavedList(lex, request.user, slForm.cleaned_data['wordList'],
                                                                    slForm.cleaned_data['listOption'], quizTime)
                    if tablenum == 0:
                        raise Http404
                    else:
                        response = HttpResponse(json.dumps(
                                                                {'url': reverse('wordwalls_table', args=(tablenum,)),
                                                                'success': True}
                                                                ),
                                                                mimetype="application/javascript")
                        response['Content-Type'] = 'text/plain; charset=utf-8'
                        return response
                        
            elif request.POST['action'] == 'savedListDelete':
                lexForm = LexiconForm(request.POST)
                slForm = SavedListForm(request.POST)
                if lexForm.is_valid() and slForm.is_valid():  
                    deletedListPk = slForm.cleaned_data['wordList'].pk
                    deleteSavedList(slForm.cleaned_data['wordList'], request.user)

                    response = HttpResponse(json.dumps(
                                                    {'deleted': True,
                                                     'wordList': deletedListPk
                                                     }
                                                    ),
                                                    mimetype="application/javascript")
                    response['Content-Type'] = 'text/plain; charset=utf-8'
                    return response
                    
            elif request.POST['action'] == 'namedListsSubmit':
                lexForm = LexiconForm(request.POST)
                timeForm = TimeForm(request.POST)
                nlForm = NamedListForm(request.POST)
                if lexForm.is_valid() and timeForm.is_valid() and nlForm.is_valid():
                    lex = Lexicon.objects.get(lexiconName=lexForm.cleaned_data['lexicon'])
                    quizTime = int(round(timeForm.cleaned_data['quizTime'] * 60))
                    wwg = WordwallsGame()
                    tablenum = wwg.initializeByNamedList(lex, request.user, nlForm.cleaned_data['namedList'], quizTime)
                    if tablenum == 0:
                        raise Http404
                    else:
                        response = HttpResponse(json.dumps(
                                                                {'url': reverse('wordwalls_table', args=(tablenum,)),
                                                                'success': True}
                                                                ),
                                                                mimetype="application/javascript")
                        response['Content-Type'] = 'text/plain; charset=utf-8'
                        return response
                    
                    
    lengthCounts = dict([(l.lexiconName, l.lengthCounts) for l in Lexicon.objects.all()])  
    
    ctx = RequestContext( request, {
      'csrf_token': get_token( request ),
    } )

    return render_to_response('wordwalls/index.html', 
                            {'fwForm': fwForm, 
                            'dcForm' : dcForm, 
                            'ulForm' : ulForm,
                            'slForm' : slForm,
                            'lexForm' : lexForm,
                            'timeForm' : timeForm,
                            'nlForm': nlForm,
                            'lengthCounts' : json.dumps(lengthCounts),
                            'upload_list_limit' : wordwalls.settings.UPLOAD_FILE_LINE_LIMIT,
                            'dcTimes': json.dumps(dcTimeMap),
                            'defaultLexicon': profile.defaultLexicon }, 
                            context_instance=ctx)


@login_required
def table(request, id):        
    logger.info("request: %s", request.method)

    if request.method == 'POST':
        action = request.POST['action']
        logger.info('action %s', action)
        if action == "start":
            lonelock(WordwallsGameModel, id)
            wwg = WordwallsGame()
            gameReady = wwg.startRequest(request.user, id)
            if not gameReady:
                response = HttpResponse(json.dumps({"serverMsg": request.user.username}), mimetype="application/javascript")
            else:
                quizParams = wwg.startQuiz(id, request.user)

                response = HttpResponse(json.dumps(quizParams, ensure_ascii=False), mimetype="application/javascript")
            response['Content-Type'] = 'text/plain; charset=utf-8'
            return response
        elif action == "guess":
            lonelock(WordwallsGameModel, id)
            logger.info('%s: guess %s, table %s', request.user.username, request.POST['guess'], id)
            
            wwg = WordwallsGame()
            
            state = wwg.guess(request.POST['guess'].strip(), id, request.user)
            
            # wgm2 = WordwallsGameModel.objects.get(pk=id)
            #             newState = json.loads(wgm2.currentGameState)
            response = HttpResponse(json.dumps({'g': state[0], 'C': state[1]}, ensure_ascii=False), 
                        mimetype="application/javascript")
            response['Content-Type'] = 'text/plain; charset=utf-8'
            

            return response
        elif action == "gameEnded":
            lonelock(WordwallsGameModel, id)
            wwg = WordwallsGame()
            ret = wwg.checkGameEnded(id)
            response = HttpResponse(json.dumps({'g': not ret}, ensure_ascii=False),     # 'going' is the opposite of 'game ended'
                        mimetype="application/javascript")
            response['Content-Type'] = 'text/plain; charset=utf-8'
            return response
        elif action == "giveUp":
            lonelock(WordwallsGameModel, id)
            wwg = WordwallsGame()
            ret = wwg.giveUp(request.user, id)        
            response = HttpResponse(json.dumps({'g': not ret}, ensure_ascii=False), 
                        mimetype="application/javascript")
            response['Content-Type'] = 'text/plain; charset=utf-8'
            return response
        elif action == "save":
            lonelock(WordwallsGameModel, id)
            wwg = WordwallsGame()
            ret = wwg.save(request.user, id, request.POST['listname'])
            response = HttpResponse(json.dumps(ret, ensure_ascii=False), 
                            mimetype="application/javascript")
            response['Content-Type'] = 'text/plain; charset=utf-8'
            return response
        elif action == "giveUpAndSave":
            lonelock(WordwallsGameModel, id)
            wwg = WordwallsGame()
            ret = wwg.giveUpAndSave(request.user, id, request.POST['listname'])
            # this shouldn't return a response, because it's not going to be caught by the javascript
            response = HttpResponse(json.dumps(ret, ensure_ascii=False), 
                            mimetype="application/javascript")
            response['Content-Type'] = 'text/plain; charset=utf-8'
            return response
        elif action == "savePrefs":
            profile = request.user.get_profile()
            profile.customWordwallsStyle = request.POST['prefs']
            profile.save()
            response = HttpResponse(json.dumps({'success': True}), 
                            mimetype="application/javascript")
            response['Content-Type'] = 'text/plain; charset=utf-8'
            return response
        elif action == "getDcData":
            wwg = WordwallsGame()
            dcId = wwg.getDcId(id)
            if dcId > 0:
                leaderboardData = getLeaderboardDataDcInstance(DailyChallenge.objects.get(pk=dcId))
                response = HttpResponse(json.dumps(leaderboardData, ensure_ascii=False), 
                                        mimetype="application/javascript")
                response['Content-Type'] = 'text/plain; charset=utf-8'
                return response
                
    else:   # it's a GET
        wwg = WordwallsGame()
        permitted = wwg.permit(request.user, id)
        if permitted:
            params = wwg.getAddParams(id)
            # add styling params from user's profile (for styling table tiles, backgrounds, etc)
            try:
                profile = request.user.get_profile()
                style = profile.customWordwallsStyle
                if style != "":
                    params['style'] = style
            except:
                pass
                
            return render_to_response('wordwalls/table.html', {'tablenum': id, 
                                                                'username': request.user.username,
                                                                'addParams': json.dumps(params)}, 
                                                    context_instance=RequestContext(request))
        else:
            return render_to_response('wordwalls/notPermitted.html', {'tablenum': id})
    
def ajax_upload(request):
    if request.method == "POST":
        lexForm = LexiconForm(request.GET)
        if lexForm.is_valid():
            lex = Lexicon.objects.get(lexiconName=lexForm.cleaned_data['lexicon'])
        else:
            raise Http404("Bad lexicon")
         
        if request.is_ajax( ):
            # the file is stored raw in the request
            upload = request
            is_raw = True
            # AJAX Upload will pass the filename in the querystring if it is the "advanced" ajax upload
            try:
                filename = request.GET[ 'qqfile' ]
            except KeyError: 
                return HttpResponseBadRequest( "AJAX request not valid" )
            # not an ajax upload, so it was the "basic" iframe version with submission via form
        else:
            is_raw = False
            if len( request.FILES ) == 1:
                    # FILES is a dictionary in Django but Ajax Upload gives the uploaded file an
                    # ID based on a random number, so it cannot be guessed here in the code.
                    # Rather than editing Ajax Upload to pass the ID in the querystring,
                    # observer that each upload is a separate request,
                    # so FILES should only have one entry.
                    # Thus, we can just grab the first (and only) value in the dict.
                upload = request.FILES.values( )[ 0 ]
            else:
                raise Http404( "Bad Upload" )
            filename = upload.name

      # save the file
        success, msg = createUserList(upload, filename, lex, request.user)
        
        # let Ajax Upload know whether we saved it or not

        ret_json = { 'success': success,
                     'msg': msg}
        return HttpResponse( json.dumps( ret_json ) )
    
def createUserList(upload, filename, lex, user):
    # TODO gevent.sleep(0.1)  (look into switching context to prevent this from blocking if using async. or use a proper queue)
    filename_stripped, extension = os.path.splitext(filename)
    try:
        SavedList.objects.get(name=filename_stripped, user=user, lexicon=lex)
        # uh oh, it exists!
        return False, "A list by the name " + filename_stripped + " already exists for this lexicon! Please rename your file."
    except:
        pass
    t1 = time.time()
    lineNumber = 0
    alphaSet = set()
    for line in upload:
        word = line.strip()
        if len(word) > 15:
            return False, "List contains non-word elements"
        lineNumber += 1
        if lineNumber > wordwalls.settings.UPLOAD_FILE_LINE_LIMIT:
            return False, "List contains more words than the current allowed per-file limit of " + str(wordwalls.settings.UPLOAD_FILE_LINE_LIMIT)
        if len(word) > 1:
            alphaSet.add(alphagrammize(word))

    profile = user.get_profile()
    numSavedAlphas = profile.wordwallsSaveListSize
    limit = wordwalls.settings.SAVE_LIST_LIMIT_NONMEMBER
    
    if (numSavedAlphas + len(alphaSet)) > limit and not profile.member:
        return False, "This list would exceed your total list size limit"
    pkList = []
    r = redis.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, db=0)
    pipe = r.pipeline()
    
    for alphagram in alphaSet:
        key = alphagram + ':' + str(lex.pk)
        pipe.get(key) 
    pkListCopy = pipe.execute()
    addlMsg = ""
    
    for pk in pkListCopy:
        if pk:
            pkList.append(int(pk))
        else:
            addlMsg = 'Could not process all your alphagrams. (Did you choose the right lexicon?)'
    
    pkList = [int(pk) for pk in pkList if pk] # turn into integers from strings in redis store
    numAlphagrams = len(pkList)
    random.shuffle(pkList)
    logger.info('number of uploaded alphagrams: %d', numAlphagrams)
    logger.info('elapsed time: %f', time.time() - t1)
    logger.info('user: %s, filename: %s', user.username, filename)

        
    
    sl = SavedList(lexicon=lex, name=filename_stripped, user=user,
                    numAlphagrams=numAlphagrams, numCurAlphagrams=numAlphagrams, numFirstMissed=0,
                    numMissed=0, goneThruOnce=False, questionIndex=0,
                    origQuestions=json.dumps(pkList), curQuestions=json.dumps(range(numAlphagrams)), 
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
    
    for lbe in lbes:
        entry = {'user': lbe.user.username, 'score': lbe.score, 'tr': lbe.timeRemaining}
        retData['entries'].append(entry)
    
    return retData

def getLeaderboardData(lex, chName):
    try:
        lex_object = Lexicon.objects.get(lexiconName=lex)
    except:
        return None
    
    if chName.name == DailyChallengeName.WEEKS_BINGO_TOUGHIES:
        from wordwalls.management.commands.genMissedBingoChalls import challengeDate
        chdate = challengeDate(delta=0)
    else:
        chdate = date.today()
    try:
        dc = DailyChallenge.objects.get(lexicon=lex_object, date=chdate, name=chName)
    except:
        return None # daily challenge doesn't exist
    
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
            return str( second_diff / 60 ) + " minutes ago"
        if second_diff < 7200:
            return "an hour ago"
        if second_diff < 86400:
            return str( second_diff / 3600 ) + " hours ago"
    if day_diff == 1:
        return "Yesterday"
    if day_diff < 7:
        return str(day_diff) + " days ago"
    if day_diff < 31:
        return str(day_diff/7) + " weeks ago"
    if day_diff < 365:
        return str(day_diff/30) + " months ago"
    return str(day_diff/365) + " years ago"    

def getSavedListList(lex, user):
    try:
        lex_object = Lexicon.objects.get(lexiconName=lex)
    except:
        return None
        
    try:
        qset = SavedList.objects.filter(lexicon=lex_object, user=user).order_by('-lastSaved')
        retData = []
        now = datetime.now()
        for sl in qset:
            retData.append({'name': sl.name,  'lastSaved': pretty_date(now, sl.lastSaved), 'lexicon': sl.lexicon.lexiconName, 
                            'goneThruOnce': sl.goneThruOnce, 'pk': sl.pk, 'numAlphas': sl.numAlphagrams})

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
            retData.append({'name': nl.name,  'lexicon': nl.lexicon.lexiconName, 
                            'numAlphas': nl.numQuestions, 'pk': nl.pk})

        return retData
    except:
        return None
        
def deleteSavedList(savedList, user):
    if savedList.user != user:      # amateur mistake not putting this in before!
        return
        
    numAlphagrams = savedList.numAlphagrams
    savedList.delete()      
    profile = user.get_profile()
    profile.wordwallsSaveListSize -= numAlphagrams
    profile.save()  
    return profile.wordwallsSaveListSize