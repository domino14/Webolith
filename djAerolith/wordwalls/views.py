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
from forms import FindWordsForm, DailyChallengesForm, UserListForm, SavedListForm, LexiconForm, TimeForm
from django.template import RequestContext
from base.models import Lexicon, Alphagram, Word, alphProbToProbPK
from django.contrib.auth.decorators import login_required
import json
from game import WordwallsGame
from game import SearchDescription
from django.core.urlresolvers import reverse
from django.http import HttpResponseRedirect, HttpResponse
from wordwalls.models import DailyChallenge, DailyChallengeLeaderboard, DailyChallengeLeaderboardEntry, SavedList, DailyChallengeName, WordwallsGameModel
from datetime import date
import sys
import time

import wordwalls.settings
import os
from locks import lonelock, loneunlock

@login_required
def homepage(request):
    lexForm = LexiconForm()
    timeForm = TimeForm()
    fwForm = FindWordsForm() # unbound
    dcForm = DailyChallengesForm() #unbound
    ulForm = UserListForm() # unbound
    slForm = SavedListForm()
    profile = request.user.get_profile()
    numAlphas = profile.wordwallsSaveListSize
    limit = 0
    if not profile.member:
        limit = wordwalls.settings.SAVE_LIST_LIMIT_NONMEMBER
    
    if request.method == 'POST':                    
        # elif 'userListsSubmit' in request.POST:
        #             # these are needed so that the forms are defined in case the ulForm.is_valid() fails. 
        #             # is there a better way to do this?
        #             
        #             ulForm = UserListForm(request.POST, request.FILES)
        #             if ulForm.is_valid():
        #                 lex = Lexicon.objects.get(lexiconName=ulForm.cleaned_data['lexicon_ul'])
        #                 wwg = WordwallsGame()
        #                 
        #                 tablenum = wwg.initializeByUserList(request.FILES['file'], lex, 
        #                             request.user, int(round(ulForm.cleaned_data['quizTime_ul'] * 60)))
        #                 #return HttpResponseRedirect('/success/url/')
        #                 if tablenum == 0:
        #                     raise Http404   # TODO better error message
        #                 else:
        #                     return HttpResponseRedirect(reverse('wordwalls_table', args=(tablenum,)))
        #         
                
        
        if 'action' in request.POST:
            print request.POST['action']
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
                    print lt
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
                    print 'challenge:', challengeName, lex
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
                print request.POST
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
                    if slForm.cleaned_data['listOption'] == SavedListForm.DELETE_LIST_CHOICE:
                        deleteSavedList(slForm.cleaned_data['wordList'], request.user)
                        # todo AJAXify this; return a response. it must have the new total list size, for this user, and it must tell
                        # the javascript to delete the non-existent list model
                    else:                    
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
                    
    lengthCounts = dict([(l.lexiconName, l.lengthCounts) for l in Lexicon.objects.all()])                         
    return render_to_response('wordwalls/index.html', 
                            {'fwForm': fwForm, 
                            'dcForm' : dcForm, 
                            'ulForm' : ulForm,
                            'slForm' : slForm,
                            'lexForm' : lexForm,
                            'timeForm' : timeForm,
                            'lengthCounts' : json.dumps(lengthCounts),
                            'upload_list_limit' : wordwalls.settings.UPLOAD_FILE_LINE_LIMIT }, 
                            context_instance=RequestContext(request))


@login_required
def table(request, id):        
    print "request:", request.method

    if request.method == 'POST':
        action = request.POST['action']
        print action
        
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
            print request.POST['guess']
            
            wwg = WordwallsGame()
            
            state = wwg.guess(request.POST['guess'], id, request.user)
            
            wgm2 = WordwallsGameModel.objects.get(pk=id)
            newState = json.loads(wgm2.currentGameState)
            response = HttpResponse(json.dumps({'g': state[0], 'C': state[1]}, ensure_ascii=False), 
                        mimetype="application/javascript")
            response['Content-Type'] = 'text/plain; charset=utf-8'
            

            return response
        elif action == "gameEnded":
            lonelock(WordwallsGameModel, id)
            wwg = WordwallsGame()
            ret = wwg.checkGameEnded(id)
            if ret:
                response = HttpResponse(json.dumps({'g': False}, ensure_ascii=False), 
                            mimetype="application/javascript")
                response['Content-Type'] = 'text/plain; charset=utf-8'
                return response
        elif action == "giveUp":
            lonelock(WordwallsGameModel, id)
            wwg = WordwallsGame()
            ret = wwg.giveUp(request.user, id)
            if ret:
                response = HttpResponse(json.dumps({'g': False}, ensure_ascii=False), 
                            mimetype="application/javascript")
                response['Content-Type'] = 'text/plain; charset=utf-8'
                return response
        elif action == "save":
            lonelock(WordwallsGameModel, id)
            wwg = WordwallsGame()
            ret = wwg.save(request.user, id, request.POST['listname'])
            print "save returned: ", ret
            response = HttpResponse(json.dumps(ret, ensure_ascii=False), 
                            mimetype="application/javascript")
            response['Content-Type'] = 'text/plain; charset=utf-8'
            return response
        elif action == "giveUpAndSave":
            lonelock(WordwallsGameModel, id)
            wwg = WordwallsGame()
            ret = wwg.giveUpAndSave(request.user, id, request.POST['listname'])
            # this shouldn't return a response, because it's not going to be caught by the javascript
            print "giveup and save returned: ", ret
            response = HttpResponse(json.dumps(ret, ensure_ascii=False), 
                            mimetype="application/javascript")
            response['Content-Type'] = 'text/plain; charset=utf-8'
            return response
        elif action == "savePrefs":
            profile = request.user.get_profile()
            profile.customWordwallsStyle = request.POST['prefs']
            print "saving custom style", profile.customWordwallsStyle
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
                print 'style', style
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
        print "lex", lex_object
    except:
        return None
    
    if chName.name == DailyChallengeName.WEEKS_BINGO_TOUGHIES:
        from wordwalls.management.commands.genMissedBingoChalls import challengeDate
        chdate = challengeDate(delta=0)
    else:
        chdate = date.today()
    print chdate
    try:
        dc = DailyChallenge.objects.get(lexicon=lex_object, date=chdate, name=chName)
        print "dc", dc
    except:
        return None # daily challenge doesn't exist
    
    return getLeaderboardDataDcInstance(dc)
        
    

def getSavedListList(lex, user):
    try:
        lex_object = Lexicon.objects.get(lexiconName=lex)
    except:
        return None
        
    try:
        qset = SavedList.objects.filter(lexicon=lex_object, user=user).order_by('lastSaved')
        retData = []
        for sl in qset:
            retData.append({'name': sl.name,  'lastSaved': str(sl.lastSaved), 'lexicon': sl.lexicon.lexiconName, 
                            'goneThruOnce': sl.goneThruOnce, 'pk': sl.pk})

        return retData
    except:
        return None

def deleteSavedList(savedList, user):
    if savedList.user != user:      # !
        return
        
    numAlphagrams = savedList.numAlphagrams
    savedList.delete()      
    profile = user.get_profile()
    profile.wordwallsSaveListSize -= numAlphagrams
    profile.save()  

#    omino14: in Apache, you just put an Alias line
#    6:51
#    munderwo
#    dominio14: admin media is the CSS and JS for the admin pages...
#    so something like this Alias /media /var/www/domain.com/iappSite/media
#    and then there is a the location bit as well..
#    6:55
#    jimmy-james [~jimmy-jam@75-144-149-126-NewEngland.hfc.comcastbusiness.net] entered the room.
#    6:55
##    munderwo
#    domino14: i think the media_url gets put into the urls that django serves up... so it does know what to serve up.. I think if you get a 404 in debug mode and it shows you all the urls that it can server up then your MEDIA_URL will be in there as well.
#    6:56
