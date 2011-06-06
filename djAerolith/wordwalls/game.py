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

from base.models import Alphagram, Word, alphProbToProbPK, probPKToAlphProb, alphagrammize
from tablegame.models import GenericTableGameModel
from wordwalls.models import WordwallsGameModel
import json
import pickle
import time
from datetime import date
import random
from wordwalls.models import DailyChallenge, DailyChallengeLeaderboard, DailyChallengeLeaderboardEntry, SavedList
import re
from forms import SavedListForm
import wordwalls.settings


class WordwallsQuestion:
    def __init__(self, alphObj):
        self.alphagram = alphObj    # a model instance
        self.notYetSolved = set(alphObj.word_set.all())

class WordwallsGame:
    # daily challenge seconds map (how many seconds per word length?)
    dcTimeMap = {2: 60, 3: 90, 4: 150, 5: 180, 6: 240, 7: 270, 8: 270, 9: 270, 
                    10: 270, 11: 270, 12: 270, 13: 300, 14: 300, 15: 300, 'bingos': 270, 'Last Week': 270}
    
    def createGameModelInstance(self, host, playerType, lex, 
                                numOrigQuestions,
                                origQuestionsStr,
                                numCurQuestions, 
                                curQuestionsStr,
                                numMissed, 
                                missedStr,
                                numFirstMissed, 
                                firstMissedStr, 
                                **StateKwargs):
        state = {
                    'answerHash': {},
                    'questionIndex': 0,
                    'questionsToPull': 50,
                    'quizGoing': False,
                    'quizStartTime': 0,
                    'numAnswersThisRound': 0,
                    'goneThruOnce': False,
                    'gameType' : 'regular'
                }

        for param in StateKwargs:
            state[param] = StateKwargs[param]
                  
        wgm = WordwallsGameModel(host=host, currentGameState=json.dumps(state), 
                                            gameType=GenericTableGameModel.WORDWALLS_GAMETYPE, 
                                            playerType=playerType, 
                                            lexicon=lex,
                                            numOrigQuestions=numOrigQuestions,
                                            origQuestions=origQuestionsStr,
                                            curQuestions=curQuestionsStr, # range(len(indices))
                                            numCurQuestions=numCurQuestions,
                                            missed=missedStr,
                                            numMissed=numMissed,
                                            firstMissed=firstMissedStr,
                                            numFirstMissed=numFirstMissed )           
                  
                    
        return wgm
    
    def initializeByDailyChallenge(self, user, challengeLex, challengeName):
        # does a daily challenge exist with this name and the current date? if not, create it.
        datenow = date.today()
        try:
            dc = DailyChallenge.objects.get(date=datenow, lexicon=challengeLex, name=challengeName)
            # pull out its indices
            pkIndices = []
            alphaPks = json.loads(dc.alphagrams)
            for alpha in alphaPks:
                pkIndices.append(alpha)                
            secs = dc.seconds
            random.shuffle(pkIndices)
        except:
            # does not exist!
            ret = self.generateDailyChallengePks(challengeName, challengeLex)
            if ret:
                pkIndices, secs = ret
                dc = DailyChallenge(date=datenow, lexicon=challengeLex, name=challengeName, 
                        seconds=secs, alphagrams=json.dumps(pkIndices))
                
                dc.save()
            else:
                return 0
        
        wgm = self.createGameModelInstance(user, GenericTableGameModel.SINGLEPLAYER_GAME, challengeLex, 
                                            len(pkIndices),
                                            json.dumps(pkIndices), 
                                            len(pkIndices),
                                            json.dumps(range(len(pkIndices))), 
                                            0,
                                            json.dumps([]), 
                                            0,
                                            json.dumps([]), 
                                            gameType='challenge',
                                            challengeId=dc.pk,
                                            timerSecs=secs)
        
        wgm.save()
        wgm.inTable.add(user)
        wgm.playing.add(user)
              
        return wgm.pk   # the table number
    
    # function to save daily challenge alphagrams into DailyChallenge model, and tie this to the alphagrams generated above somehow.
    

    
    def initializeBySearchParams(self, user, alphasSearchDescription, playerType, timeSecs):
        pkIndices = self.getPkIndices(alphasSearchDescription)
        
        wgm = self.createGameModelInstance(user, playerType, alphasSearchDescription['lexicon'], 
                                            len(pkIndices),
                                            json.dumps(pkIndices), 
                                            len(pkIndices),
                                            json.dumps(range(len(pkIndices))), 
                                            0,
                                            json.dumps([]), 
                                            0,
                                            json.dumps([]),
                                            timerSecs=timeSecs)
        wgm.save()
        wgm.inTable.add(user)
        wgm.playing.add(user)
        return wgm.pk   # this is a table number id!
    
    def initializeByUserList(self, file, lex, user, secs):
        # returns a table number
        # TODO gevent.sleep(0.1)  (look into switching context to prevent this from blocking if using async. or use a proper queue)
        t1 = time.time()
        lineNumber = 0
        alphaSet = set()
        for line in file:
            word = line.strip()
            if len(word) > 15 or len(word) < 2:
                return 0
            lineNumber += 1
            if lineNumber > wordwalls.settings.UPLOAD_FILE_LINE_LIMIT:
                return 0
            alphaSet.add(alphagrammize(word))

        pkList = []
        failedAlphagrams = []
        for alphagram in alphaSet:
            try:
                a = Alphagram.objects.get(alphagram=alphagram, lexicon=lex)
                pkList.append(a.pk)
            except:
                failedAlphagrams.append(alphagram)
                # doesn't exist here. TODO send a message saying some of your words couldn't be uploaded.

        random.shuffle(pkList)
        print 'number of uploaded alphagrams', len(pkList)
        print 'elapsed time', time.time() - t1

        addlParams = {'timerSecs': secs}
        if len(failedAlphagrams) > 0:
            addlParams['introMessage'] = ('Could not process all your alphagrams. (Did you choose the right lexicon?) ' +
                                    'You had ' + str(len(failedAlphagrams)) + ' unmatched alphagrams (the first of which is ' +
                                    failedAlphagrams[0] +').')
        
        wgm = self.createGameModelInstance(user, GenericTableGameModel.SINGLEPLAYER_GAME, lex, 
                                            len(pkList),
                                            json.dumps(pkList), 
                                            len(pkList),
                                            json.dumps(range(len(pkList))), 
                                            0,
                                            json.dumps([]), 
                                            0,
                                            json.dumps([]), 
                                            **addlParams)
        
        
        wgm.save()
        wgm.inTable.add(user)
        wgm.playing.add(user)
        return wgm.pk   # this is a table number id!
        
        #sl = SavedList(lexicon=lex, name=listName, user=user.username, state=json.dumps(saveObj), )
    
    def initializeBySavedList(self, lex, user, savedList, listOption, secs):
        # first of all, return 0 if the user and the saved list don't match. TODO test this
        if savedList.user != user:
            return 0

        if listOption == SavedListForm.FIRST_MISSED_CHOICE and savedList.goneThruOnce == False:
            print 'error, first missed list only valid if player has gone thru list once'
            return 0    # can't do a 'first missed' list if we haven't gone thru it once!        
        
        addlParams = {}
        origQuestionsStr = savedList.origQuestions
        goneThruOnce = savedList.goneThruOnce
        if listOption == SavedListForm.RESTART_LIST_CHOICE:
            # reset quiz to just original questions
            addlParams['questionIndex'] = 0
            curQuestionsStr = json.dumps(range(savedList.numAlphagrams))
            numCurQuestions = savedList.numAlphagrams
            firstMissedStr = json.dumps([])
            numFirstMissed = 0
            missedStr = json.dumps([])
            numMissed = 0
            goneThruOnce = False
        else:
        # add the other keys that the state variable needs.
            if listOption == SavedListForm.FIRST_MISSED_CHOICE:
                curQuestionsStr = savedList.firstMissed
                numCurQuestions = savedList.numFirstMissed    # TODO maybe keep track of this length in database
                firstMissedStr = savedList.firstMissed
                numFirstMissed = savedList.numFirstMissed
                
                addlParams['questionIndex'] = 0
                numMissed = 0
                missedStr = json.dumps([])
            else:   # continue list
                curQuestionsStr = savedList.curQuestions
                numCurQuestions = savedList.numCurAlphagrams
                firstMissedStr = savedList.firstMissed
                numFirstMissed = savedList.numFirstMissed
                missedStr = savedList.missed
                numMissed = savedList.numMissed
                addlParams['questionIndex'] = savedList.questionIndex
        
        addlParams['saveName'] = savedList.name
        addlParams['goneThruOnce'] = goneThruOnce
        addlParams['timerSecs'] = secs
        wgm = self.createGameModelInstance(user, GenericTableGameModel.SINGLEPLAYER_GAME, lex, 
                                                    savedList.numAlphagrams,
                                                    origQuestionsStr, 
                                                    numCurQuestions,
                                                    curQuestionsStr, 
                                                    numMissed,
                                                    missedStr,
                                                    numFirstMissed, 
                                                    firstMissedStr, 
                                                    **addlParams)   
                                                    
        wgm.save()
        wgm.inTable.add(user)
        wgm.playing.add(user)
        return wgm.pk   # this is a table number id!
        
    # startRequest may be not used at all until later. for now we only have two types of games:
    # single player will start right away with no 'request' needed
    # multiplayer will have timed starts - every minute or so
    
    def getDcId(self, tablenum):
        try:
            wgm = WordwallsGameModel.objects.get(pk=tablenum)
        except:
            return 0
        state = json.loads(wgm.currentGameState)
        try:
            return state['challengeId']
        except:
            return 0
    def startRequest(self, user, tablenum):
        try:
            wgm = WordwallsGameModel.objects.get(pk=tablenum)
        except:
            return False # table not found
        # check if the player that sent the request is actually in the table.
        if user in wgm.inTable.all():
            #print user, "sent start request!"
            #if user not in wgm.playing.all():
            #    wgm.playing.add(user)
            return True
        else:
            return False
            
    def createErrorMessage(self, message):
        return {'error':message} 
                    
    def startQuiz(self, tablenum):
        try:
            wgm = WordwallsGameModel.objects.get(pk=tablenum)
        except:
            return self.createErrorMessage("That table does not exist.")
        
        state = json.loads(wgm.currentGameState)
        
        if state['quizGoing']:
            return self.createErrorMessage("The quiz is currently running.")   
                # the quiz is running right now; do not attempt to start again
        startMessage = ""
        curQuestionsObj = json.loads(wgm.curQuestions)
        origQuestionsObj = json.loads(wgm.origQuestions)
        
        if state['questionIndex'] > wgm.numCurQuestions - 1:
            startMessage += "Now quizzing on missed list.\r\n"
            curQuestionsObj = json.loads(wgm.missed)
            wgm.curQuestions = wgm.missed
            wgm.numCurQuestions = len(curQuestionsObj)
            wgm.missed = json.dumps([])
            wgm.numMissed = 0
            updateCurQs = True
            
            state['questionIndex'] = 0
            state['quizGoing'] = False

        if wgm.numCurQuestions == 0:
            wgm.currentGameState = json.dumps(state)
            wgm.save()
            return self.createErrorMessage("The quiz is done. Please exit the table and have a nice day!")
        
        qs = curQuestionsObj[state['questionIndex']:state['questionIndex']+state['questionsToPull']]

        startMessage += "These are questions " + str(state['questionIndex'] + 1) + " thru "
        startMessage += str(len(qs) + state['questionIndex']) + " of " + str(wgm.numCurQuestions) + "."
        
        state['questionIndex'] += state['questionsToPull']
        
        questions = []
        answerHash = {}
        for i in qs:
            a = Alphagram.objects.get(pk=origQuestionsObj[i])
            words = []
            for w in a.word_set.all():
                words.append({'w': w.word, 'd': w.definition, 'fh': w.front_hooks, 
                                'bh': w.back_hooks, 's': w.lexiconSymbols})
                answerHash[w.word] = a.alphagram, i
            questions.append({'a' : a.alphagram, 'ws':words, 'p': probPKToAlphProb(a.pk)})
        state['quizGoing'] = True   # start quiz
        state['quizStartTime'] = time.time()
        state['answerHash'] = answerHash
        state['numAnswersThisRound'] = len(answerHash)
        wgm.currentGameState = json.dumps(state)
        wgm.save()
     

     
        ret = {'questions':questions, 'time':state['timerSecs'], 'gameType':state['gameType'],
                'serverMsg':startMessage}
     
        return ret
    
    
    def didTimerRunOut(self, state):
        # internal function; not meant to be called by the outside
        return (state['quizStartTime'] + state['timerSecs']) < time.time()
    
    def checkGameEnded(self, tablenum): # called when javascript tells the server that time ran out on its end
        # TODO think about what happens if javascript tells the server too early
        try:
            wgm = WordwallsGameModel.objects.get(pk=tablenum)
        except:
            return False
        state = json.loads(wgm.currentGameState)
        if self.didTimerRunOut(state) and state['quizGoing']:
            # the game is over! mark it so.  
            state['timeRemaining'] = 0
            self.doQuizEndActions(state, tablenum, wgm)
            wgm.currentGameState = json.dumps(state)
            wgm.save()
            
            return True
        
        return False
    
    def giveUp(self, user, tablenum):
        try:
            wgm = WordwallsGameModel.objects.get(pk=tablenum)
        except:
            return False
        if wgm.playerType == GenericTableGameModel.SINGLEPLAYER_GAME and user in wgm.inTable.all():
            state = json.loads(wgm.currentGameState)
            if state['quizGoing'] == False: 
                return False
            
            state['timeRemaining'] = 0
            self.doQuizEndActions(state, tablenum, wgm)
            wgm.currentGameState = json.dumps(state)
            wgm.save()
            return True
        
        return False
    
    def getAddParams(self, tablenum):
        try:
            wgm = WordwallsGameModel.objects.get(pk=tablenum)
        except:
            return {}
        
        state = json.loads(wgm.currentGameState)
        if 'saveName' in state:
            return {'saveName': state['saveName']}
        else:
            return {}
    
    def giveUpAndSave(self, user, tablenum, listname):
        if self.giveUp(user, tablenum):
            return self.save(user, tablenum, listname)
        else:
            return {'success': False}
    
    def save(self, user, tablenum, listname):
        print "called save"
        ret = {'success': False}
        try:
            wgm = WordwallsGameModel.objects.get(pk=tablenum)
        except:
            ret['info'] = 'That table does not exist!'
            return ret
    
        s = re.search(r"\S", listname)  # make sure the list name is not just all whitespace
        if s is None:
            ret['info'] = 'Please enter a valid list name!'
            return ret 

        if wgm.playerType == GenericTableGameModel.SINGLEPLAYER_GAME and user in wgm.inTable.all():
            state = json.loads(wgm.currentGameState)
            if state['quizGoing']:  # TODO actually should check if time ran out
                # this seems like an arbitrary limitation but it makes things a lot easier. we can change this later.
                ret['info'] = 'You can only save the game at the end of a round.'
                return ret

            # now check if a list with this name, lexicon, and user exists
            profile = user.get_profile()
            if profile.member:
                limit = wordwalls.settings.SAVE_LIST_LIMIT_MEMBER
            else:
                limit = wordwalls.settings.SAVE_LIST_LIMIT_NONMEMBER
            
            exceededLimitMessage = 'Unable to save list because you have gone over the number of total alphagrams limit '
            exceededLimitMessage += '(' + str(limit) + '). You can increase this limit by becoming a supporter!'
            profileModified = False
            try:
                sl = SavedList.objects.get(lexicon=wgm.lexicon, name=listname, user=user)
                oldNumAlphas = sl.numAlphagrams
                sl.origQuestions = wgm.origQuestions
                sl.missed = wgm.missed
                sl.numMissed = wgm.numMissed
                sl.curQuestions = wgm.curQuestions
                sl.numCurAlphagrams = wgm.numCurQuestions
                sl.firstMissed = wgm.firstMissed
                sl.numFirstMissed = wgm.numFirstMissed
                sl.questionIndex = state['questionIndex']
                sl.name = listname
                sl.numAlphagrams = wgm.numOrigQuestions
                sl.goneThruOnce = state['goneThruOnce']
                ret['info'] = 'A list with that name and lexicon already existed, and has been overwritten'                
                # TODO too bad?
                if sl.numAlphagrams != oldNumAlphas:
                    # the number of total alphagrams in all lists for this user has changed.
                    if profile.wordwallsSaveListSize - oldNumAlphas + sl.numAlphagrams > limit:
                        ret['info'] = exceededLimitMessage
                        return ret
                    profile.wordwallsSaveListSize = profile.wordwallsSaveListSize - oldNumAlphas + sl.numAlphagrams
                    profileModified = True
            except:
                sl = SavedList(lexicon=wgm.lexicon, name=listname, user=user,
                            numAlphagrams=wgm.numOrigQuestions, 
                            origQuestions=wgm.origQuestions,
                            missed=wgm.missed,
                            numMissed=wgm.numMissed,
                            curQuestions=wgm.curQuestions,
                            numCurAlphagrams=wgm.numCurQuestions,
                            numFirstMissed=wgm.numFirstMissed,
                            firstMissed=wgm.firstMissed,
                            questionIndex=state['questionIndex'],
                            goneThruOnce=state['goneThruOnce'])
                
                    
                if profile.wordwallsSaveListSize + wgm.numOrigQuestions > limit:
                    ret['info'] = exceededLimitMessage
                    return ret 
                
                profile.wordwallsSaveListSize += wgm.numOrigQuestions
                profileModified = True

            try:
                sl.save()
                ret['success'] = True
                state['saveName'] = listname
                wgm.currentGameState = json.dumps(state)
                wgm.save()
                if profileModified: 
                    profile.save()
                
                return ret
            except:
                ret['info'] = 'Could not save for some other reason!'
                return ret
        else:
            ret['info'] = 'Your game must be a single player game!'
            return ret    
            
    def doQuizEndActions(self, state, tablenum, wgm):
        state['quizGoing'] = False
        state['LastCorrect'] = ""
        # copy missed alphagrams to state['missed']
        missedPks = set()
        for w in state['answerHash']:
            missedPks.add(state['answerHash'][w][1]) # [0] is the alphagram, [1] is the index in origQuestions
        
        missed = json.loads(wgm.missed)
        missed.extend(missedPks)
        wgm.missed = json.dumps(missed)
        wgm.numMissed = len(missed)
        
        print len(missedPks), "missed this round"
        if state['gameType'] == 'challenge':
            state['gameType'] = 'challengeOver'
            self.createChallengeLeaderboardEntries(state, tablenum)
            
        # check if we've gone thru the quiz once.
        if state['questionIndex'] > wgm.numCurQuestions - 1:
            if not state['goneThruOnce']: 
                state['goneThruOnce'] = True
                wgm.firstMissed = wgm.missed
                wgm.numFirstMissed = wgm.numMissed
        
    def createChallengeLeaderboardEntries(self, state, tablenum):
        # first create a leaderboard if one doesn't exist for this challenge
        try:
            dc = DailyChallenge.objects.get(pk=state['challengeId'])
        except:
            return  # this shouldn't happen
        try:
            lb = DailyChallengeLeaderboard.objects.get(challenge=dc)
        except:
            # doesn't exist
            lb = DailyChallengeLeaderboard(challenge=dc, maxScore=state['numAnswersThisRound'])
            lb.save()
        wgm = WordwallsGameModel.objects.get(pk=tablenum)
        # now create an entry; if one exists, don't modify it, just return
        
        try:
            lbe = DailyChallengeLeaderboardEntry.objects.get(user=wgm.host, board=lb)
            # if it exists, we're here
            return  # TODO is there a cleaner way of doing this? this seems very ugly
            
        except DailyChallengeLeaderboardEntry.DoesNotExist:
            score = state['numAnswersThisRound'] - len(state['answerHash'])
            if 'timeRemaining' in state:
                timeRemaining = int(round(state['timeRemaining']))   # if there was time remaining, it would get written into the state
                                                                # inside the guess processing function
            else:
                timeRemaining = 0                               # else, nothing would write it into the state
            lbe = DailyChallengeLeaderboardEntry(user=wgm.host, score=score, board=lb, 
                                    timeRemaining=timeRemaining)
            lbe.save()
        
    def getPkIndices(self, searchDescription):           
        if searchDescription['condition'] == 'probPKRange':
            minP = searchDescription['min']
            maxP = searchDescription['max']
            r = range(minP, maxP+1)
            random.shuffle(r)
            return r
        elif searchDescription['condition'] == 'probPKList':
            pass

    def guess(self, guessStr, tablenum):
        guessStr = guessStr.upper()
        t1 = time.time()
        wgm = WordwallsGameModel.objects.get(pk=tablenum)
        #print "Time to get", time.time() - t1
        t1 = time.time()
        state = json.loads(wgm.currentGameState)
        #print "time to load state", time.time() - t1
        t1 = time.time()
        if self.didTimerRunOut(state):
            stateChanged = True
            state['timeRemaining'] = 0
            self.doQuizEndActions(state, tablenum, wgm)

        if state['quizGoing']:
            if guessStr not in state['answerHash']:
                state['LastCorrect'] = ""
            else:
                alpha = state['answerHash'][guessStr]
                del state['answerHash'][guessStr]
                if len(state['answerHash']) == 0:
                    timeRemaining = (state['quizStartTime'] + state['timerSecs']) - time.time()
                    if timeRemaining < 0: timeRemaining = 0
                    state['timeRemaining'] = timeRemaining
                    self.doQuizEndActions(state, tablenum, wgm)
                state['LastCorrect'] = alpha[0]    
            stateChanged = True
        
        if stateChanged:
            #print "time to check", time.time() - t1
            t1 = time.time()
            wgm.currentGameState = json.dumps(state)
            #print "time to dump", time.time() - t1
            t1 = time.time()
            wgm.save()
            #print "time to save", time.time() - t1            

        return state['quizGoing'], state['LastCorrect']
            
    def permit(self, user, tablenum):
        try:
            wgm = WordwallsGameModel.objects.get(pk=tablenum)
        except:
            return False # table not found 
        if wgm.playerType == GenericTableGameModel.MULTIPLAYER_GAME:
            return True #todo unless there is an invite list, etc in the future
        # else    
        if user != wgm.host:    # single player, return false!
            print user
            print wgm.host
            return False
        
        return True     
        
    def generateDailyChallengePks(self, challengeName, lex):
        # capture number. first try to match to today's lists
        m = re.match("Today's (?P<length>[0-9]+)s", challengeName.name)
        
        if m:
            wordLength = int(m.group('length'))
            if wordLength < 2 or wordLength > 15: return None   # someone is trying to break my server >:(
            print 'Generating daily challenges', lex, wordLength
            minP = 1
            maxP = json.loads(lex.lengthCounts)[repr(wordLength)] # lengthCounts is a dictionary of strings as keys        
            
            r = range(minP, maxP+1)
            random.shuffle(r)
            r = r[:50]  # just the first 50 elements for the daily challenge
            print r
            pks = [alphProbToProbPK(i, lex.pk, wordLength) for i in r]
            return pks, WordwallsGame.dcTimeMap[wordLength]
        return None        
            
class SearchDescription:
    @staticmethod
    def probPkIndexRange(minP, maxP, lex):
        return {"condition": "probPKRange", "min": minP, "max": maxP, "lexicon": lex}        
        

    
    # now save the questions
    
    
    # then create a saved list obj

        #query = self.state['pickledQuery']
        
        #query = self.alphasQuery[self.minIndex:self.maxIndex]
        #numQs = query.count()
        
        
        #if numQs == 0:
        #    self.thisRoundQuestions = self.missed
        #else:
        #    for a in query:
        #        wwq = WordwallsQuestion(a)
        #        self.thisRoundQuestions.append(wwq)
        #        for w in a.word_set.all():
        #            self.answerHash[w.word] = wwq
        #    print "q len", len(self.thisRoundQuestions)

        
        
        #    self.minIndex += 50
        #    self.maxIndex += 50
            
        #return self.thisRoundQuestions
    

    
        