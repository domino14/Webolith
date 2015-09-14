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

from base.models import (alphProbToProbPK, probPKToAlphProb,
                         alphagrammize, WordList)
from tablegame.models import GenericTableGameModel
from wordwalls.models import WordwallsGameModel
import json
import time
from datetime import date
import random
from wordwalls.models import (DailyChallenge, DailyChallengeLeaderboard,
                              DailyChallengeLeaderboardEntry,
                              DailyChallengeMissedBingos, DailyChallengeName,
                              NamedList)
import re
from base.forms import SavedListForm
import base.settings
import logging
from django.db import IntegrityError
import os
from wordwalls.management.commands.genNamedLists import (FRIENDLY_COMMON_SHORT,
                                                         FRIENDLY_COMMON_LONG)
logger = logging.getLogger(__name__)


try:
    COMMON_SHORT_NAMED_LIST = NamedList.objects.get(name=FRIENDLY_COMMON_SHORT)
    COMMON_LONG_NAMED_LIST = NamedList.objects.get(name=FRIENDLY_COMMON_LONG)
except NamedList.DoesNotExist:
    COMMON_SHORT_NAMED_LIST = None
    COMMON_LONG_NAMED_LIST = None


class WordwallsGame(object):
    def _initial_state(self):
        """ Return an initial state object, for a brand new game. """
        return {
            'answerHash': {},
            'questionsToPull': 50,
            'quizGoing': False,
            'quizStartTime': 0,
            'numAnswersThisRound': 0,
            'goneThruOnce': False,
            'gameType': 'regular'
        }

    def create_game_instance(self, host, lex, word_list, **state_kwargs):
        state = self._initial_state()
        for param in state_kwargs:
            state[param] = state_kwargs[param]
        wgm = WordwallsGameModel(
            host=host, currentGameState=json.dumps(state),
            gameType=GenericTableGameModel.WORDWALLS_GAMETYPE,
            playerType=GenericTableGameModel.SINGLEPLAYER_GAME,
            lexicon=lex,
            word_list=word_list)
        return wgm

    def initialize_word_list(self, alphagrams, lexicon, user):
        """
        Initializes a word list with the given array of alphagrams and
        returns it.

        """
        wl = WordList()
        wl.initialize_list(alphagrams, lexicon, user)
        return wl

    def get_dc(self, ch_date, ch_lex, ch_name):
        """
        Gets a challenge with date, lex, name.

        """
        dc = DailyChallenge.objects.get(date=ch_date, lexicon=ch_lex,
                                        name=ch_name)
        # pull out its indices

        qs = json.loads(dc.alphagrams)
        secs = dc.seconds
        random.shuffle(qs)
        return qs, secs, dc

    def initialize_daily_challenge(self, user, ch_lex, ch_name, ch_date):
        """
        Initializes a WordwallsGame daily challenge.

        """

        # Does a daily challenge exist with this name and date?
        # If not, create it.
        today = date.today()
        qualify_for_award = False
        if ch_name.name == DailyChallengeName.WEEKS_BINGO_TOUGHIES:
            # Repeat on Tuesday at midnight local time (ie beginning of
            # the day, 0:00) Tuesday is an isoweekday of 2. Find the
            # nearest Tuesday back in time. isoweekday goes from 1 to 7.
            from wordwalls.management.commands.genMissedBingoChalls import (
                challengeDateFromReqDate)
            ch_date = challengeDateFromReqDate(ch_date)
            if ch_date == challengeDateFromReqDate(today):
                qualify_for_award = True
        # otherwise, it's not a 'bingo toughies', but a regular challenge.
        else:
            if ch_date == today:
                qualify_for_award = True

        ret = self.get_or_create_dc(ch_date, ch_lex, ch_name)
        if ret is None:
            return 0
        qs, secs, dc = ret
        wl = self.initialize_word_list(qs, ch_lex, user)
        wgm = self.create_game_instance(user, ch_lex, wl,
                                        # Extra parameters to be put in 'state'
                                        gameType='challenge',
                                        challengeId=dc.pk,
                                        timerSecs=secs,
                                        qualifyForAward=qualify_for_award)
        wgm.save()
        return wgm.pk   # the table number

    def get_or_create_dc(self, ch_date, ch_lex, ch_name):
        """
        Get, or create, a daily challenge with the given parameters.

        """
        try:
            qs, secs, dc = self.get_dc(ch_date, ch_lex, ch_name)
        except DailyChallenge.DoesNotExist:
            try:
                ret = self.generate_dc_pks(ch_name, ch_lex, ch_date)
                if not ret:
                    return None
            except IOError:
                return None

            qs, secs = ret
            dc = DailyChallenge(date=ch_date, lexicon=ch_lex,
                                name=ch_name, seconds=secs,
                                alphagrams=json.dumps(qs))
            try:
                dc.save()
            except IntegrityError:
                logger.exception("Caught integrity error")
                # This happens rarely if the DC gets generated twice
                # in very close proximity.
                qs, secs, dc = self.get_dc(ch_date, ch_lex, ch_name)

        return qs, secs, dc

    def initialize_by_search_params(self, user, alphasSearchDescription,
                                    timeSecs):
        pk_indices = self.get_pk_indices(alphasSearchDescription)
        lexicon = alphasSearchDescription['lexicon']
        wl = self.initialize_word_list(pk_indices, lexicon, user)
        wgm = self.create_game_instance(user, lexicon, wl, timerSecs=timeSecs)
        wgm.save()
        return wgm.pk   # this is a table number id!

    def initialize_by_named_list(self, lex, user, namedList, secs):
        pks = json.loads(namedList.questions)
        if namedList.isRange:
            pks = range(pks[0], pks[1] + 1)
        random.shuffle(pks)
        wl = self.initialize_word_list(pks, lex, user)
        wgm = self.create_game_instance(user, lex, wl, timerSecs=secs)
        wgm.save()
        return wgm.pk

    def initialize_by_saved_list(self, lex, user, saved_list, list_option,
                                 secs):
        if saved_list.user != user:
            # Maybe this isn't a big deal.
            logger.warning('Saved list user does not match user %s %s',
                           saved_list.user, user)
            return 0

        if (list_option == SavedListForm.FIRST_MISSED_CHOICE and
                saved_list.goneThruOnce is False):
            logger.warning('error, first missed list only valid if player has '
                           'gone thru list once')
            return 0    # Can't do a 'first missed' list if we haven't gone
                        # through it once!

        self.maybe_modify_word_list(saved_list, list_option)
        wgm = self.create_game_instance(user, lex, saved_list,
                                        saveName=saved_list.name,
                                        goneThruOnce=saved_list.gone_thru_once,
                                        timerSecs=secs)

        wgm.save()
        return wgm.pk   # this is a table number id!

    def maybe_modify_word_list(self, word_list, list_option):
        """
        Modifies the passed-in word list based on the options. If the
        user chose to continue, does not modify word list.

        """

        if list_option == SavedListForm.RESTART_LIST_CHOICE:
            word_list.restart_list(shuffle=True)
        elif list_option == SavedListForm.FIRST_MISSED_CHOICE:
            word_list.set_to_first_missed()
        # Otherwise, if the user chose to continue, no changes need to
        # be made.

    def get_dc_id(self, tablenum):
        wgm = self.get_wgm(tablenum, lock=False)
        if not wgm:
            return 0
        state = json.loads(wgm.currentGameState)
        return state.get('challengeId', 0)

    def create_error_message(self, message):
        return {'error': message}

    def start_quiz(self, tablenum, user):
        wgm = self.get_wgm(tablenum)
        if not wgm:
            return self.create_error_message("That table does not exist.")
        state = json.loads(wgm.currentGameState)

        if state['quizGoing']:
            logger.debug('The quiz is going, state %s', state)
            return self.create_error_message("The quiz is currently running.")
                # the quiz is running right now; do not attempt to start again
        start_message = ""
        word_list = wgm.word_list
        # Modifying - right here.
        if word_list.questionIndex > word_list.numCurAlphagrams - 1:
            start_message += "Now quizzing on missed list.\r\n"
            word_list.set_to_missed()
            state['quizGoing'] = False

        if word_list.numCurAlphagrams == 0:
            wgm.currentGameState = json.dumps(state)
            wgm.save()
            return self.create_error_message(
                "The quiz is done. Please exit the table and have a nice day!")

        cur_questions_obj = json.loads(word_list.curQuestions)
        idx = word_list.questionIndex
        num_qs_per_round = state['questionsToPull']
        qs = cur_questions_obj[idx:(idx + num_qs_per_round)]

        start_message += "These are questions %d through %d of %d." % (
            idx + 1, len(qs) + idx, word_list.numCurAlphagrams)

        word_list.questionIndex += num_qs_per_round

        qs_set = set(qs)
        if len(qs_set) != len(qs):
            logger.error("Question set is not unique!!")

        answerHash = {}
        questions = self.load_questions(qs,
                                        json.loads(word_list.origQuestions))
        state['quizGoing'] = True   # start quiz
        state['quizStartTime'] = time.time()
        state['answerHash'] = answerHash
        state['numAnswersThisRound'] = len(answerHash)
        wgm.currentGameState = json.dumps(state)
        wgm.save()

        ret = {'questions': questions,
               'time': state['timerSecs'],
               'gameType': state['gameType'],
               'serverMsg': start_message}

        return ret

    def load_questions(self, qs, orig_questions):
        """
        Turn the qs array into an array of full question objects, ready
        for the front-end.

        Params:
            - qs: An array of indices into oriq_questions
            - orig_questions: An array of question "objects":
                - An "object" can be a regular integer alphagram pk
                (deprecated when we migrate)
                - An object can be a dict {'q': 'ABC?',
                                           'a': [word_pk1, word_pk2, ...]}
                Migration will turn them all into dicts:
                {'q': 'ABC?', 'a': ['CABS', 'SCAB', ...]}

        """
        for i in qs:
            words = []
            if type(orig_questions[i]) == int:
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
                              's': w.lexiconSymbols, 'ifh': w.inner_front_hook,
                              'ibh': w.inner_back_hook})
                answerHash[w.word] = alphagram_str, i
            questions.append({'a': alphagram_str, 'ws': words,
                              'p': probPKToAlphProb(alphagram_pk),
                              'idx': i})


    def didTimerRunOut(self, state):
        # internal function; not meant to be called by the outside
        return (state['quizStartTime'] + state['timerSecs']) < time.time()

    def get_wgm(self, tablenum, lock=True):
        """
            Get word game model.
            :lock Should lock if this is a write operation. This is because
            the object can be updated simultaneously from various places :/
        """
        try:
            if lock:
                wgm = WordwallsGameModel.objects.select_for_update().get(
                    pk=tablenum)
            else:
                wgm = WordwallsGameModel.objects.get(pk=tablenum)
        except WordwallsGameModel.DoesNotExist:
            return None
        return wgm

    def checkGameEnded(self, tablenum):
        # Called when javascript tells the server that time ran out on
        # its end. TODO think about what happens if javascript tells the
        # server too early
        wgm = self.get_wgm(tablenum)
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
        wgm = self.get_wgm(tablenum)
        if not wgm:
            return False
        if wgm.playerType == GenericTableGameModel.SINGLEPLAYER_GAME:
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
        wgm = self.get_wgm(tablenum, lock=False)
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
        logger.debug('user=%s, tablenum=%s, listname=%s, event=save',
                     user, tablenum, listname)
        ret = {'success': False}
        wgm = self.get_wgm(tablenum)
        if not wgm:
            ret['info'] = 'That table does not exist!'
            return ret

        # make sure the list name is not just all whitespace
        s = re.search(r"\S", listname)
        if s is None:
            ret['info'] = 'Please enter a valid list name!'
            return ret

        if not wgm.playerType == GenericTableGameModel.SINGLEPLAYER_GAME:
            ret['info'] = 'Your game must be a single player game!'
            return ret
        state = json.loads(wgm.currentGameState)
        logger.debug('state=%s', state)
        if state['quizGoing']:
            # TODO actually should check if time ran out
            # this seems like an arbitrary limitation but it makes
            # things a lot easier. we can change this later.
            ret['info'] = ('You can only save the game at the end of '
                           'a round.')
            logger.warning('Unable to save, quiz is going.')
            return ret

        # now check if a list with this name, lexicon, and user exists
        profile = user.aerolithprofile
        if profile.member:
            limit = base.settings.SAVE_LIST_LIMIT_MEMBER
        else:
            limit = base.settings.SAVE_LIST_LIMIT_NONMEMBER

        exceededLimitMessage = (
            'Unable to save list because you have gone over the number '
            'of total alphagrams limit (%d). You can increase this limit '
            'by becoming a supporter!' % limit)
        profileModified = False
        try:
            sl = SavedList.objects.select_for_update().get(
                lexicon=wgm.lexicon, name=listname, user=user)
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
            # XXX: 500 here, integrity error, very rare.
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
            # XXX: 500 here, integrity error, much more common than lb.save
            lbe.save()
            if (len(state['answerHash']) > 0 and dc.name.name in
                    ("Today's 7s", "Today's 8s")):
                # if the user missed some 7s or 8s
                self.addDCMissedBingos(state, dc, wgm)

    def add_dc_missed_bingo(self, challenge, alphagram):
        """
            Adds a Daily Challenge Missed Bingo in a thread-safe manner.
        """
        try:
            dcmb = DailyChallengeMissedBingos.objects.select_for_update().get(
                challenge=challenge,
                alphagram=alphagram)
            dcmb.numTimesMissed += 1
        except DailyChallengeMissedBingos.DoesNotExist:
            dcmb = DailyChallengeMissedBingos(challenge=challenge,
                                              alphagram=alphagram)
            dcmb.numTimesMissed = 1
        try:
            dcmb.save()
        except IntegrityError:
            logger.exception('Caught MissedBingos IntegrityError')
            # It means another thread created it (in the except above).
            # We should start over, but now that we know the object exists,
            # we can use select_for_update without fear.
            dcmb = DailyChallengeMissedBingos.objects.select_for_update().get(
                challenge=challenge, alphagram=alphagram)
            dcmb.numTimesMissed += 1
            dcmb.save()

    def addDCMissedBingos(self, state, dc, wgm):
        origQsObj = json.loads(wgm.origQuestions)
        missedAlphas = set()
        for missed in state['answerHash']:
            alphaPk = origQsObj[state['answerHash'][missed][1]]
            missedAlphas.add(Alphagram.objects.get(pk=alphaPk))

        for alpha in missedAlphas:
            self.add_dc_missed_bingo(dc, alpha)

    def get_pk_indices(self, searchDescription):
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
        wgm = self.get_wgm(tablenum)
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
        wgm = self.get_wgm(tablenum)
        if not wgm:
            return
        state = json.loads(wgm.currentGameState)
        if not state['quizGoing']:
            logger.info('Guess came in after quiz ended.')
            return
        # Otherwise, let's process the guess.
        if self.didTimerRunOut(state):
            state['timeRemaining'] = 0
            logger.info('Timer ran out, end quiz.')
            self.doQuizEndActions(state, tablenum, wgm)
            # Save state back to game.
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
        wgm = self.get_wgm(tablenum, lock=False)
        if not wgm:
            return False
        if wgm.playerType == GenericTableGameModel.MULTIPLAYER_GAME:
            # TODO unless there is an invite list, etc in the future
            return True
        # else
        if user != wgm.host:    # single player, return false!
            return False
        return True

    def generate_dc_pks(self, challengeName, lex, chDate):
        """
        Generate the alphagram PKs for a daily challenge.
        Returns:
            A tuple (pks, time_secs)

        """
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
        # There was no match, check other possible challenge names.
        if challengeName.name == DailyChallengeName.WEEKS_BINGO_TOUGHIES:
            from wordwalls.management.commands.genMissedBingoChalls import(
                genPks)
            mbs = genPks(lex, chDate)
            pks = [mb[0] for mb in mbs]
            random.shuffle(pks)
            return pks, challengeName.timeSecs
        elif challengeName.name == DailyChallengeName.BLANK_BINGOS:
            questions = self.generate_blank_bingos_challenge(lex, chDate)
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
        elif challengeName.name in (DailyChallengeName.COMMON_SHORT,
                                    DailyChallengeName.COMMON_LONG):
            questions = self.generate_common_words_challenge(
                challengeName.name)
            random.shuffle(questions)
            return questions, challengeName.timeSecs
        return None

    def generate_common_words_challenge(self, ch_name):
        """Generate the common words challenges. Only for OWL2 right now."""
        if ch_name == DailyChallengeName.COMMON_SHORT:
            pks = json.loads(COMMON_SHORT_NAMED_LIST.questions)
        elif ch_name == DailyChallengeName.COMMON_LONG:
            pks = json.loads(COMMON_LONG_NAMED_LIST.questions)
        random.shuffle(pks)
        return pks[:50]

    def generate_blank_bingos_challenge(self, lex, ch_date):
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


class SearchDescription(object):
    @staticmethod
    def prob_pk_index_range(min_p, max_p, length, lex):
        return {"condition": "prob_range",
                "length": length,
                "min": min_p, "max": max_p,
                "lexicon": lex}
