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

from base.models import (Alphagram, alphProbToProbPK, probPKToAlphProb,
                         alphagrammize, Word)
from tablegame.models import GenericTableGameModel
from wordwalls.models import WordwallsGameModel
import json
import time
from datetime import date, datetime
import random
from wordwalls.models import (DailyChallenge, DailyChallengeLeaderboard,
                              DailyChallengeLeaderboardEntry, SavedList)
from wordwalls.models import DailyChallengeMissedBingos, DailyChallengeName
import re
from base.forms import SavedListForm
import wordwalls.settings
from locks import lonelock
import logging
from django.db import IntegrityError
import os
logger = logging.getLogger(__name__)


class WordwallsGame:
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
        state = {'answerHash': {},
                 'questionIndex': 0,
                 'questionsToPull': 50,
                 'quizGoing': False,
                 'quizStartTime': 0,
                 'numAnswersThisRound': 0,
                 'goneThruOnce': False,
                 'gameType': 'regular'}

        for param in StateKwargs:
            state[param] = StateKwargs[param]

        wgm = WordwallsGameModel(
            host=host,
            currentGameState=json.dumps(state),
            gameType=GenericTableGameModel.WORDWALLS_GAMETYPE,
            playerType=playerType,
            lexicon=lex,
            numOrigQuestions=numOrigQuestions,
            origQuestions=origQuestionsStr,
            curQuestions=curQuestionsStr,  # range(len(indices))
            numCurQuestions=numCurQuestions,
            missed=missedStr,
            numMissed=numMissed,
            firstMissed=firstMissedStr,
            numFirstMissed=numFirstMissed)

        return wgm

    def getDc(self, chDate, chLex, chName):
        """
            Gets a challenge with date, lex, name.
        """
        dc = DailyChallenge.objects.get(date=chDate, lexicon=chLex,
                                        name=chName)
        # pull out its indices

        qs = json.loads(dc.alphagrams)
        secs = dc.seconds
        random.shuffle(qs)
        return qs, secs, dc

    def initializeByDailyChallenge(self, user, challengeLex, challengeName,
                                   challengeDate):
        # Does a daily challenge exist with this name and the current
        # date? If not, create it.
        today = date.today()
        qualifyForAward = False
        if challengeName.name == DailyChallengeName.WEEKS_BINGO_TOUGHIES:
            # Repeat on Tuesday at midnight local time (ie beginning of
            # the day, 0:00) Tuesday is an isoweekday of 2. Find the
            # nearest Tuesday back in time. isoweekday goes from 1 to 7.
            from wordwalls.management.commands.genMissedBingoChalls import (
                challengeDateFromReqDate)
            chDate = challengeDateFromReqDate(challengeDate)
            if chDate == challengeDateFromReqDate(today):
                qualifyForAward = True
        # otherwise, it's not a 'bingo toughies', but a regular challenge.
        else:
            chDate = challengeDate
            if chDate == today:
                qualifyForAward = True

        try:
            qs, secs, dc = self.getDc(
                chDate, challengeLex, challengeName)
        except DailyChallenge.DoesNotExist:
            # does not exist!
            try:
                ret = self.generateDailyChallengePks(challengeName,
                                                     challengeLex,
                                                     chDate)
            except IOError:
                return 0
            if ret:
                qs, secs = ret
                dc = DailyChallenge(date=chDate, lexicon=challengeLex,
                                    name=challengeName, seconds=secs,
                                    alphagrams=json.dumps(qs))
                try:
                    dc.save()
                except IntegrityError:
                    logger.exception("Caught integrity error")
                    # This happens rarely if the DC gets generated twice
                    # in very close proximity.
                    qs, secs, dc = self.getDc(chDate, challengeLex,
                                              challengeName)
            else:
                return 0
        num_questions = len(qs)
        wgm = self.createGameModelInstance(
            user, GenericTableGameModel.SINGLEPLAYER_GAME, challengeLex,
            num_questions,
            json.dumps(qs),
            num_questions,
            json.dumps(range(num_questions)),
            0,
            json.dumps([]),
            0,
            json.dumps([]),
            gameType='challenge',
            challengeId=dc.pk,
            timerSecs=secs,
            qualifyForAward=qualifyForAward,
            questionsToPull=num_questions)
        wgm.save()
        wgm.inTable.add(user)
        return wgm.pk   # the table number

    def initializeBySearchParams(self, user, alphasSearchDescription,
                                 playerType, timeSecs):
        pkIndices = self.getPkIndices(alphasSearchDescription)
        wgm = self.createGameModelInstance(
            user, playerType, alphasSearchDescription['lexicon'],
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
        return wgm.pk   # this is a table number id!

    def initializeByNamedList(self, lex, user, namedList, secs):
        addlParams = {}
        addlParams['timerSecs'] = secs
        pks = json.loads(namedList.questions)
        if namedList.isRange:
            pks = range(pks[0], pks[1] + 1)
        if len(pks) != namedList.numQuestions:
            raise
        random.shuffle(pks)
        wgm = self.createGameModelInstance(
            user, GenericTableGameModel.SINGLEPLAYER_GAME, lex,
            namedList.numQuestions,
            json.dumps(pks),
            namedList.numQuestions,
            json.dumps(range(len(pks))),
            0,
            json.dumps([]),
            0,
            json.dumps([]),
            **addlParams)
        wgm.save()
        wgm.inTable.add(user)
        return wgm.pk

    def initializeBySavedList(self, lex, user, savedList, listOption, secs):
        # First of all, return 0 if the user and the saved list don't
        # match. TODO test this.
        if savedList.user != user:
            return 0

        if (listOption == SavedListForm.FIRST_MISSED_CHOICE and
                savedList.goneThruOnce is False):
            logger.info('error, first missed list only valid if player has '
                        'gone thru list once')
            return 0    # Can't do a 'first missed' list if we haven't gone
                        # through it once!

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
            #TODO shuffle origQuestions
        else:
        # add the other keys that the state variable needs.
            if listOption == SavedListForm.FIRST_MISSED_CHOICE:
                curQuestionsStr = savedList.firstMissed
                # TODO maybe keep track of this length in database
                numCurQuestions = savedList.numFirstMissed
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
        wgm = self.createGameModelInstance(
            user, GenericTableGameModel.SINGLEPLAYER_GAME, lex,
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

        return wgm.pk   # this is a table number id!

    def getDcId(self, tablenum):
        wgm = self.getWGM(tablenum)
        if not wgm:
            return 0
        state = json.loads(wgm.currentGameState)
        return state.get('challengeId', 0)

    # startRequest may be not used at all until later. for now we only
    # have two types of games: single player will start right away with
    # no 'request' needed multiplayer will have timed starts - every
    # minute or so
    def startRequest(self, user, tablenum):
        wgm = self.getWGM(tablenum)
        if not wgm:
            return False
        # check if the player that sent the request is actually in the table.
        if user in wgm.inTable.all():
            #print user, "sent start request!"
            #if user not in wgm.playing.all():
            #    wgm.playing.add(user)
            return True
        else:
            return False

    def createErrorMessage(self, message):
        return {'error': message}

    def startQuiz(self, tablenum, user):
        wgm = self.getWGM(tablenum)
        if not wgm:
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

            state['questionIndex'] = 0
            state['quizGoing'] = False

        if wgm.numCurQuestions == 0:
            wgm.currentGameState = json.dumps(state)
            wgm.save()
            return self.createErrorMessage(
                "The quiz is done. Please exit the table and have a nice day!")
        qs = curQuestionsObj[
            state['questionIndex']:state['questionIndex'] +
            state['questionsToPull']]

        startMessage += "These are questions %d through %d of %d." % (
            state['questionIndex'] + 1, len(qs) + state['questionIndex'],
            wgm.numCurQuestions)

        state['questionIndex'] += state['questionsToPull']

        qsSet = set(qs)
        if len(qsSet) != len(qs):
            logger.info("Question set is not unique!!")

        questions = []
        answerHash = {}
        for i in qs:
            words = []
            if type(origQuestionsObj[i]) == int:
                a = Alphagram.objects.get(pk=origQuestionsObj[i])
                alphagram_str = a.alphagram
                alphagram_pk = a.pk
                word_set = a.word_set.all()
            elif type(origQuestionsObj[i]) == dict:
                # This is a direct alphagram, usually a blank alphagram.
                alphagram_str = origQuestionsObj[i]['q']
                alphagram_pk = None
                word_set = [Word.objects.get(pk=word_pk) for word_pk in
                            origQuestionsObj[i]['a']]
            for w in word_set:
                words.append({'w': w.word, 'd': w.definition,
                              'fh': w.front_hooks, 'bh': w.back_hooks,
                              's': w.lexiconSymbols})
                answerHash[w.word] = alphagram_str, i
            questions.append({'a': alphagram_str, 'ws': words,
                              'p': probPKToAlphProb(alphagram_pk),
                              'idx': i})
        state['quizGoing'] = True   # start quiz
        state['quizStartTime'] = time.time()
        state['answerHash'] = answerHash
        state['numAnswersThisRound'] = len(answerHash)
        wgm.currentGameState = json.dumps(state)
        wgm.save()

        ret = {'questions': questions,
               'time': state['timerSecs'],
               'gameType': state['gameType'],
               'serverMsg': startMessage}

        return ret

    def didTimerRunOut(self, state):
        # internal function; not meant to be called by the outside
        return (state['quizStartTime'] + state['timerSecs']) < time.time()

    def getWGM(self, tablenum):
        try:
            wgm = WordwallsGameModel.objects.get(pk=tablenum)
        except WordwallsGameModel.DoesNotExist:
            return None
        return wgm

    def checkGameEnded(self, tablenum):
        # Called when javascript tells the server that time ran out on
        # its end. TODO think about what happens if javascript tells the
        # server too early
        wgm = self.getWGM(tablenum)
        if not wgm:
            return False

        state = json.loads(wgm.currentGameState)
        if self.didTimerRunOut(state) and state['quizGoing']:
            # the game is over! mark it so.
            state['timeRemaining'] = 0
            self.doQuizEndActions(state, tablenum, wgm)
            wgm.currentGameState = json.dumps(state)
            wgm.save()

            return True
        else:
            logger.info('Got game ended but did not actually end: '
                        'start_time=%f timer=%f now=%f quizGoing=%s',
                        state['quizStartTime'], state['timerSecs'],
                        time.time(), state['quizGoing'])
            return False

    def giveUp(self, user, tablenum):
        wgm = self.getWGM(tablenum)
        if not wgm:
            return False
        if (wgm.playerType == GenericTableGameModel.SINGLEPLAYER_GAME and
                user in wgm.inTable.all()):
            state = json.loads(wgm.currentGameState)
            if state['quizGoing'] is False:
                logger.info("the quiz isn't going. can't give up.")
                return False

            state['timeRemaining'] = 0
            self.doQuizEndActions(state, tablenum, wgm)
            wgm.currentGameState = json.dumps(state)
            wgm.save()
            return True
        return False

    def getAddParams(self, tablenum):
        wgm = self.getWGM(tablenum)
        if not wgm:
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
        logger.info("called save")
        ret = {'success': False}
        wgm = self.getWGM(tablenum)
        if not wgm:
            ret['info'] = 'That table does not exist!'
            return ret

        # make sure the list name is not just all whitespace
        s = re.search(r"\S", listname)
        if s is None:
            ret['info'] = 'Please enter a valid list name!'
            return ret

        if (wgm.playerType == GenericTableGameModel.SINGLEPLAYER_GAME and
                user in wgm.inTable.all()):
            state = json.loads(wgm.currentGameState)
            if state['quizGoing']:
                # TODO actually should check if time ran out
                # this seems like an arbitrary limitation but it makes
                # things a lot easier. we can change this later.
                ret['info'] = ('You can only save the game at the end of '
                               'a round.')
                return ret

            # now check if a list with this name, lexicon, and user exists
            profile = user.get_profile()
            if profile.member:
                limit = wordwalls.settings.SAVE_LIST_LIMIT_MEMBER
            else:
                limit = wordwalls.settings.SAVE_LIST_LIMIT_NONMEMBER

            exceededLimitMessage = (
                'Unable to save list because you have gone over the number '
                'of total alphagrams limit (%d). You can increase this limit '
                'by becoming a supporter!' % limit)
            profileModified = False
            try:
                sl = SavedList.objects.get(lexicon=wgm.lexicon,
                                           name=listname, user=user)
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
                ret['info'] = ('A list with that name and lexicon already '
                               'existed, and has been overwritten.')
                # TODO too bad?
                if sl.numAlphagrams != oldNumAlphas:
                    # The number of total alphagrams in all lists for
                    # this user has changed.
                    if (profile.wordwallsSaveListSize - oldNumAlphas +
                            sl.numAlphagrams > limit):
                        ret['info'] = exceededLimitMessage
                        return ret
                    profile.wordwallsSaveListSize = (
                        profile.wordwallsSaveListSize - oldNumAlphas +
                        sl.numAlphagrams)
                    profileModified = True
            except SavedList.DoesNotExist:
                sl = SavedList(
                    lexicon=wgm.lexicon, name=listname, user=user,
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

                if (profile.wordwallsSaveListSize + wgm.numOrigQuestions >
                        limit):
                    ret['info'] = exceededLimitMessage
                    return ret

                profile.wordwallsSaveListSize += wgm.numOrigQuestions
                profileModified = True

            try:
                sl.save()
                ret['success'] = True
                ret['listname'] = listname
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
        state['justCreatedFirstMissed'] = False
        # copy missed alphagrams to state['missed']
        missed_indices = set()
        for w in state['answerHash']:
            missed_indices.add(state['answerHash'][w][1])
            # [0] is the alphagram, [1] is the index in origQuestions

        missed = json.loads(wgm.missed)
        missed.extend(missed_indices)
        wgm.missed = json.dumps(missed)
        wgm.numMissed = len(missed)

        # check if the list is unique
        uniqueMissed = set(missed)
        if len(uniqueMissed) != len(missed):
            logger.info("missed list is not unique!!")
            #raise Exception('Missed list is not unique')

        logger.info("%d missed this round, %d missed total",
                    len(missed_indices), len(missed))
        if state['gameType'] == 'challenge':
            state['gameType'] = 'challengeOver'
            self.createChallengeLeaderboardEntries(state, tablenum, wgm)

        # check if we've gone thru the quiz once.
        if state['questionIndex'] > wgm.numCurQuestions - 1:
            if not state['goneThruOnce']:
                state['goneThruOnce'] = True
                state['justCreatedFirstMissed'] = True
                logger.debug('Creating first missed list from missed')
                wgm.firstMissed = wgm.missed
                wgm.numFirstMissed = wgm.numMissed

    def createChallengeLeaderboardEntries(self, state, tablenum, wgm):
        # First create a leaderboard if one doesn't exist for this challenge.
        try:
            dc = DailyChallenge.objects.get(pk=state['challengeId'])
        except DailyChallenge.DoesNotExist:
            return  # this shouldn't happen
        try:
            lb = DailyChallengeLeaderboard.objects.get(challenge=dc)
        except DailyChallengeLeaderboard.DoesNotExist:
            # doesn't exist
            lb = DailyChallengeLeaderboard(
                challenge=dc, maxScore=state['numAnswersThisRound'])
            lb.save()
        wgm = WordwallsGameModel.objects.get(pk=tablenum)
        # Now create an entry; if one exists, don't modify it, just return.

        try:
            lbe = DailyChallengeLeaderboardEntry.objects.get(
                user=wgm.host, board=lb)
            # If it exists, we're here. don't update the leaderboard
            # entry because we can only do the quiz once.
            return

        except DailyChallengeLeaderboardEntry.DoesNotExist:
            score = state['numAnswersThisRound'] - len(state['answerHash'])
            if 'timeRemaining' in state:
                timeRemaining = int(round(state['timeRemaining']))
                # If there was time remaining, it would get written into the
                # state inside the guess processing function.
            else:
                # Else, nothing would write it into the state.
                timeRemaining = 0

            if 'qualifyForAward' in state:
                qualifyForAward = state['qualifyForAward']
            else:
                qualifyForAward = False     # i suppose this shouldn't happen

            lbe = DailyChallengeLeaderboardEntry(
                user=wgm.host, score=score, board=lb,
                timeRemaining=timeRemaining, qualifyForAward=qualifyForAward)
            lbe.save()
            if (len(state['answerHash']) > 0 and dc.name.name in
                    ("Today's 7s", "Today's 8s")):
                # if the user missed some 7s or 8s
                self.addDCMissedBingos(state, dc, wgm)

    def addDCMissedBingos(self, state, dc, wgm):
        origQsObj = json.loads(wgm.origQuestions)
        missedAlphas = set()
        for missed in state['answerHash']:
            alphaPk = origQsObj[state['answerHash'][missed][1]]
            missedAlphas.add(Alphagram.objects.get(pk=alphaPk))

        lonelock(DailyChallenge, dc.pk)
        # Always lock the daily challenge missed bingos list here
        # because of the += 1 below.
        # Will be unlocked on db disconnect.

        for alpha in missedAlphas:
            try:
                dcmb = DailyChallengeMissedBingos.objects.get(
                    challenge=dc, alphagram=alpha)
                dcmb.numTimesMissed += 1
            except DailyChallengeMissedBingos.DoesNotExist:
                # if it doesn't exist, we must create it
                dcmb = DailyChallengeMissedBingos(
                    challenge=dc, alphagram=alpha, numTimesMissed=1)

            dcmb.save()

    def getPkIndices(self, searchDescription):
        if searchDescription['condition'] == 'probPKRange':
            minP = searchDescription['min']
            maxP = searchDescription['max']
            r = range(minP, maxP + 1)
            random.shuffle(r)
            return r
        elif searchDescription['condition'] == 'probPKList':
            pass

    def mark_missed(self, question_index, tablenum, user):
        try:
            question_index = int(question_index)
        except (ValueError, TypeError):
            return False
        wgm = self.getWGM(tablenum)
        if not wgm:
            return 'No table #%s exists' % tablenum
        missed = json.loads(wgm.missed)
        state = json.loads(wgm.currentGameState)
        if question_index not in set(missed):
            missed.append(question_index)
            wgm.missed = json.dumps(missed)
            if state.get('justCreatedFirstMissed'):
                logger.debug('Also adding to first missed count')
                # Also add to first missed count.
                first_missed = json.loads(wgm.firstMissed)
                if question_index not in set(first_missed):
                    first_missed.append(question_index)
                    wgm.numFirstMissed += 1
                    wgm.firstMissed = json.dumps(first_missed)

            wgm.save()
            return True
        return False

    def guess(self, guessStr, tablenum, user):
        guessStr = guessStr.upper()
        wgm = self.getWGM(tablenum)
        if not wgm:
            return (False, '')
        state = json.loads(wgm.currentGameState)
        if state['quizGoing']:
            if self.didTimerRunOut(state):
                state['timeRemaining'] = 0
                self.doQuizEndActions(state, tablenum, wgm)
                # also sets state['LastCorrect'] to ''
            else:
                if guessStr not in state['answerHash']:
                    state['LastCorrect'] = ""
                else:
                    alpha = state['answerHash'][guessStr]
                    # state['answerHash'] is modified here
                    del state['answerHash'][guessStr]
                    if len(state['answerHash']) == 0:
                        timeRemaining = (state['quizStartTime'] +
                                         state['timerSecs']) - time.time()
                        if timeRemaining < 0:
                            timeRemaining = 0
                        state['timeRemaining'] = timeRemaining
                        self.doQuizEndActions(state, tablenum, wgm)
                    state['LastCorrect'] = alpha[0]

            wgm.currentGameState = json.dumps(state)
            wgm.save()

        return state['quizGoing'], state.get('LastCorrect', '')

    def permit(self, user, tablenum):
        wgm = self.getWGM(tablenum)
        if not wgm:
            return False
        if wgm.playerType == GenericTableGameModel.MULTIPLAYER_GAME:
            # TODO unless there is an invite list, etc in the future
            return True
        # else
        if user != wgm.host:    # single player, return false!
            return False
        return True

    def generateDailyChallengePks(self, challengeName, lex, chDate):
        # capture number. first try to match to today's lists
        m = re.match("Today's (?P<length>[0-9]+)s",
                     challengeName.name)

        if m:
            wordLength = int(m.group('length'))
            if wordLength < 2 or wordLength > 15:
                return None   # someone is trying to break my server >:(
            logger.info('Generating daily challenges %s %d', lex, wordLength)
            minP = 1
            # lengthCounts is a dictionary of strings as keys
            maxP = json.loads(lex.lengthCounts)[repr(wordLength)]

            r = range(minP, maxP + 1)
            random.shuffle(r)
            r = r[:50]  # just the first 50 elements for the daily challenge
            pks = [alphProbToProbPK(i, lex.pk, wordLength) for i in r]
            return pks, challengeName.timeSecs
        else:
            if challengeName.name == DailyChallengeName.WEEKS_BINGO_TOUGHIES:
                from wordwalls.management.commands.genMissedBingoChalls import(
                    genPks)
                mbs = genPks(lex, chDate)
                pks = [mb[0] for mb in mbs]
                random.shuffle(pks)
                return pks, challengeName.timeSecs
            elif challengeName.name == DailyChallengeName.BLANK_BINGOS:
                questions = self.generate_blank_bingos(lex, chDate)
                random.shuffle(questions)
                return questions, challengeName.timeSecs
            elif challengeName.name == DailyChallengeName.BINGO_MARATHON:
                pks = []
                for lgt in (7, 8):
                    min_p = 1
                    max_p = json.loads(lex.lengthCounts)[str(lgt)]
                    r = range(min_p, max_p + 1)
                    random.shuffle(r)
                    pks += [alphProbToProbPK(i, lex.pk, lgt) for i in r[:50]]
                return pks, challengeName.timeSecs
        return None

    def generate_blank_bingos(self, lex, ch_date):
        """
            Reads the previously generated blank bingo files for lex.
        """
        start = time.time()
        bingos = []
        for length in (7, 8):
            filename = ch_date.strftime("%Y-%m-%d") + "-%s-%ss.txt" % (
                lex.lexiconName, length)
            path = os.path.join(os.getenv("HOME"), 'blanks', filename)
            f = open(path, 'rb')
            for line in f:
                qas = line.split()
                # Look up pks for words.
                words = qas[1:]
                word_pks = [Word.objects.get(word=word, lexicon=lex).pk for
                            word in words]
                bingos.append({'q': alphagrammize(qas[0]), 'a': word_pks})
            f.close()
        logger.debug("Elapsed: %s" % (time.time() - start))
        return bingos


class SearchDescription:
    @staticmethod
    def probPkIndexRange(minP, maxP, lex):
        return {"condition": "probPKRange",
                "min": minP, "max": maxP,
                "lexicon": lex}
