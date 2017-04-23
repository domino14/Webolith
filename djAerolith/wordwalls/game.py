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

import json
import time
import copy
import logging
import re

from django.conf import settings
from django.db import IntegrityError
from django.utils.translation import ugettext as _
from django.utils import timezone

from base.forms import SavedListForm
from lib.word_db_helper import WordDB, Questions
from lib.word_searches import word_search
from wordwalls.challenges import generate_dc_questions
from base.models import WordList
from tablegame.models import GenericTableGameModel
from wordwalls.models import WordwallsGameModel
from wordwalls.challenges import toughies_challenge_date
from wordwalls.models import (DailyChallenge, DailyChallengeLeaderboard,
                              DailyChallengeLeaderboardEntry,
                              DailyChallengeMissedBingos, DailyChallengeName)
logger = logging.getLogger(__name__)


class GameInitException(Exception):
    pass


class WordwallsGame(object):
    def _initial_state(self):
        """ Return an initial state object, for a brand new game. """
        return {
            'answerHash': {},
            'originalAnswerHash': {},
            'questionsToPull': settings.WORDWALLS_QUESTIONS_PER_ROUND,
            'quizGoing': False,
            'quizStartTime': 0,
            'numAnswersThisRound': 0,
            'gameType': 'regular'
        }

    def maybe_modify_list_name(self, list_name, user):
        """
        Given a temporary `list_name` for a `user`, modify it if user
        already has a list with this list name. We don't want to
        silently overwrite lists.

        """
        orig_list_name = list_name
        user_lists = WordList.objects.filter(
            user=user, is_temporary=False).filter(name=list_name)
        repeat = 1
        while user_lists.count() > 0:
            list_name = '{0} ({1})'.format(orig_list_name, repeat)
            user_lists = WordList.objects.filter(
                user=user, is_temporary=False).filter(name=list_name)
            repeat += 1
        return list_name

    def create_or_update_game_instance(self, host, lex, word_list, use_table,
                                       **state_kwargs):
        state = self._initial_state()
        if 'temp_list_name' in state_kwargs:
            state_kwargs['temp_list_name'] = self.maybe_modify_list_name(
                state_kwargs['temp_list_name'], host
            )

        for param in state_kwargs:
            state[param] = state_kwargs[param]
        if state['questionsToPull'] is None:
            state['questionsToPull'] = settings.WORDWALLS_QUESTIONS_PER_ROUND

        if use_table is None:
            wgm = WordwallsGameModel(
                host=host, currentGameState=json.dumps(state),
                gameType=GenericTableGameModel.WORDWALLS_GAMETYPE,
                playerType=GenericTableGameModel.SINGLEPLAYER_GAME,
                lexicon=lex,
                word_list=word_list)
        else:
            wgm = self.get_wgm(tablenum=use_table, lock=True)
            wgm.currentGameState = json.dumps(state)
            wgm.lexicon = lex
            wgm.word_list = word_list
        wgm.save()

        return wgm

    def initialize_word_list(self, questions, lexicon, user):
        """
        Initializes a word list with the given questions and
        returns it.

        questions - An instance of Questions.
        lexicon - An instance of base.Lexicon
        user - The user.

        """
        wl = WordList()
        wl.initialize_list(questions.to_python(), lexicon, user, shuffle=True)
        return wl

    def get_dc(self, ch_date, ch_lex, ch_name):
        """
        Gets a challenge with date, lex, name.

        """
        dc = DailyChallenge.objects.get(date=ch_date, lexicon=ch_lex,
                                        name=ch_name)
        qs = Questions()
        qs.set_from_json(dc.alphagrams)
        qs.shuffle()
        secs = dc.seconds
        return qs, secs, dc

    def initialize_daily_challenge(self, user, ch_lex, ch_name, ch_date,
                                   use_table=None):
        """
        Initializes a WordwallsGame daily challenge.

        """

        # Does a daily challenge exist with this name and date?
        # If not, create it.
        today = timezone.localtime(timezone.now()).date()
        qualify_for_award = False
        if ch_name.name == DailyChallengeName.WEEKS_BINGO_TOUGHIES:
            # Repeat on Tuesday at midnight local time (ie beginning of
            # the day, 0:00) Tuesday is an isoweekday of 2. Find the
            # nearest Tuesday back in time. isoweekday goes from 1 to 7.
            ch_date = toughies_challenge_date(ch_date)
            if ch_date == toughies_challenge_date(today):
                qualify_for_award = True
        # otherwise, it's not a 'bingo toughies', but a regular challenge.
        else:
            if ch_date == today:
                qualify_for_award = True

        ret = self.get_or_create_dc(ch_date, ch_lex, ch_name)
        if ret is None:
            raise GameInitException('Unable to create daily challenge {0}'.
                                    format(ch_name))
        qs, secs, dc = ret
        wl = self.initialize_word_list(qs, ch_lex, user)
        temporary_list_name = '{0} {1} - {2}'.format(
            ch_lex.lexiconName,
            ch_name.name,
            ch_date.strftime('%Y-%m-%d')
        )
        wgm = self.create_or_update_game_instance(
            user, ch_lex, wl, use_table,
            # Extra parameters to be put in 'state'
            gameType='challenge',
            questionsToPull=qs.size(),
            challengeId=dc.pk,
            timerSecs=secs,
            temp_list_name=temporary_list_name,
            qualifyForAward=qualify_for_award)
        return wgm.pk   # the table number

    def get_or_create_dc(self, ch_date, ch_lex, ch_name):
        """
        Get, or create, a daily challenge with the given parameters.

        """
        try:
            qs, secs, dc = self.get_dc(ch_date, ch_lex, ch_name)
        except DailyChallenge.DoesNotExist:
            ret = generate_dc_questions(ch_name, ch_lex, ch_date)
            if not ret:
                return None

            qs, secs = ret
            if qs.size() == 0:
                logger.error('Empty questions.')
                return None
            dc = DailyChallenge(date=ch_date, lexicon=ch_lex,
                                name=ch_name, seconds=secs,
                                alphagrams=qs.to_json())
            try:
                dc.save()
            except IntegrityError:
                logger.exception("Caught integrity error")
                # This happens rarely if the DC gets generated twice
                # in very close proximity.
                qs, secs, dc = self.get_dc(ch_date, ch_lex, ch_name)

        return qs, secs, dc

    def initialize_by_search_params(self, user, search_description, time_secs,
                                    questions_per_round=None, use_table=None):
        lexicon = search_description['lexicon']
        wl = self.initialize_word_list(word_search(search_description),
                                       lexicon, user)
        temporary_list_name = '{0} {1}s ({2} - {3})'.format(
            search_description['lexicon'].lexiconName,
            search_description['length'],
            search_description['min'],
            search_description['max']
        )
        wgm = self.create_or_update_game_instance(
            user, lexicon, wl, use_table, timerSecs=time_secs,
            temp_list_name=temporary_list_name,
            questionsToPull=questions_per_round)
        return wgm.pk   # this is a table number id!

    def initialize_by_named_list(self, lex, user, named_list, secs,
                                 questions_per_round=None, use_table=None):
        qs = json.loads(named_list.questions)
        db = WordDB(lex.lexiconName)
        if named_list.isRange:
            questions = db.get_questions_for_probability_range(
                qs[0], qs[1], named_list.wordLength, order=False)
            wl = self.initialize_word_list(questions, lex, user)
        else:
            # Initialize word list directly.
            wl = WordList()
            wl.initialize_list(qs, lex, user, shuffle=True)

        wgm = self.create_or_update_game_instance(
            user, lex, wl, use_table, timerSecs=secs,
            temp_list_name=named_list.name,
            questionsToPull=questions_per_round)
        return wgm.pk

    def initialize_by_saved_list(self, lex, user, saved_list, list_option,
                                 secs, questions_per_round=None,
                                 use_table=None):
        if saved_list.user != user:
            # Maybe this isn't a big deal.
            logger.warning('Saved list user does not match user %s %s',
                           saved_list.user, user)
            raise GameInitException('Saved list user does not match user.')
        if list_option is None:
            logger.warning('Invalid list_option.')
            raise GameInitException('Invalid list option.')

        if (list_option == SavedListForm.FIRST_MISSED_CHOICE and
                saved_list.goneThruOnce is False):
            logger.warning('Error, first missed list only valid if player has '
                           'gone thru list once.')
            raise GameInitException('Cannot quiz on first missed unless you '
                                    'have gone through list once.')

        self.maybe_modify_word_list(saved_list, list_option)
        wgm = self.create_or_update_game_instance(
            user, lex, saved_list, use_table,
            saveName=saved_list.name,
            timerSecs=secs,
            questionsToPull=questions_per_round)
        return wgm.pk   # this is a table number id!

    def maybe_modify_word_list(self, word_list, list_option):
        """
        Modifies the passed-in word list based on the options. If the
        user chose to continue, does not modify word list.

        Note that this saves the word list.

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
            return self.create_error_message(_("That table does not exist."))
        state = json.loads(wgm.currentGameState)

        if state['quizGoing']:
            logger.debug('The quiz is going, state %s', state)
            # The quiz is running right now; do not attempt to start again
            return self.create_error_message(
                _("The quiz is currently running."))

        start_message = ""
        word_list = wgm.word_list

        if not word_list:
            return self.create_error_message(
                _('It appears this word list has been deleted. Please '
                  'load or create a new word list.'))

        if word_list.questionIndex > word_list.numCurAlphagrams - 1:
            start_message += _("Now quizzing on missed list.") + "\r\n"
            word_list.set_to_missed()
            state['quizGoing'] = False

        if word_list.numCurAlphagrams == 0:
            wgm.currentGameState = json.dumps(state)
            wgm.save()
            return self.create_error_message(
                _("The quiz is done. Please load a new word list!"))

        cur_questions_obj = json.loads(word_list.curQuestions)
        idx = word_list.questionIndex
        num_qs_per_round = state['questionsToPull']
        qs = cur_questions_obj[idx:(idx + num_qs_per_round)]

        start_message += _(
            "These are questions %(qbegin)s through %(qend)s of "
            "%(qtotal)s.") % {'qbegin': idx + 1,
                              'qend': len(qs) + idx,
                              'qtotal': word_list.numCurAlphagrams}

        word_list.questionIndex += num_qs_per_round

        qs_set = set(qs)
        if len(qs_set) != len(qs):
            logger.error("Question set is not unique!!")

        questions, answer_hash = self.load_questions(
            qs, json.loads(word_list.origQuestions), word_list.lexicon)
        state['quizGoing'] = True   # start quiz
        state['quizStartTime'] = time.time()
        state['answerHash'] = answer_hash
        state['originalAnswerHash'] = copy.deepcopy(answer_hash)
        state['numAnswersThisRound'] = len(answer_hash)
        wgm.currentGameState = json.dumps(state)
        wgm.save()
        word_list.save()
        ret = {'questions': questions,
               'time': state['timerSecs'],
               'gameType': state['gameType'],
               'serverMsg': start_message}

        return ret

    def load_questions(self, qs, orig_questions, lexicon):
        """
        Turn the qs array into an array of full question objects, ready
        for the front-end.

        Params:
            - qs: An array of indices into oriq_questions
            - orig_questions: An array of questions, looking like
                [{'q': ..., 'a': [...]}, ...]

        Returns:
            - A tuple (questions, answer_hash)
                questions: [{'a': alphagram, 'ws': words, ...}, {..}, ..]
                answer_hash: {'word': (alphagram, idx), ...}

        """
        db = WordDB(lexicon.lexiconName)
        alphagrams_to_fetch = []
        index_map = {}
        for i in qs:
            alphagrams_to_fetch.append(orig_questions[i])
            index_map[orig_questions[i]['q']] = i

        questions = db.get_questions_from_alph_dicts(alphagrams_to_fetch)
        answer_hash = {}
        ret_q_array = []

        for q in questions.questions_array():
            words = []
            alphagram_str = q.alphagram.alphagram
            i = index_map[alphagram_str]
            for w in q.answers:
                words.append({'w': w.word, 'd': w.definition,
                              'fh': w.front_hooks, 'bh': w.back_hooks,
                              's': w.lexicon_symbols,
                              'ifh': w.inner_front_hook,
                              'ibh': w.inner_back_hook})
                answer_hash[w.word] = alphagram_str, i
            ret_q_array.append({'a': alphagram_str, 'ws': words,
                                'p': q.alphagram.probability, 'idx': i})
        return ret_q_array, answer_hash

    def did_timer_run_out(self, state):
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

    def check_game_ended(self, tablenum):
        # Called when javascript tells the server that time ran out on
        # its end. TODO think about what happens (on the front-end)
        # if javascript tells the server too early.
        wgm = self.get_wgm(tablenum)
        if not wgm:
            return False

        state = json.loads(wgm.currentGameState)
        if self.did_timer_run_out(state) and state['quizGoing']:
            # the game is over! mark it so.
            state['timeRemaining'] = 0
            self.do_quiz_end_actions(state, tablenum, wgm)
            wgm.currentGameState = json.dumps(state)
            wgm.save()

            return True
        logger.info('Got game ended but did not actually end: '
                    'start_time=%f timer=%f now=%f quizGoing=%s',
                    state['quizStartTime'], state['timerSecs'],
                    time.time(), state['quizGoing'])
        return False

    def give_up(self, user, tablenum):
        wgm = self.get_wgm(tablenum)
        if not wgm:
            return False
        if wgm.playerType == GenericTableGameModel.SINGLEPLAYER_GAME:
            state = json.loads(wgm.currentGameState)
            if state['quizGoing'] is False:
                logger.info("the quiz isn't going. can't give up.")
                return False

            state['timeRemaining'] = 0
            self.do_quiz_end_actions(state, tablenum, wgm)
            wgm.currentGameState = json.dumps(state)
            wgm.save()
            return True
        return False

    def get_add_params(self, tablenum):
        wgm = self.get_wgm(tablenum, lock=False)
        if not wgm:
            return {}

        state = json.loads(wgm.currentGameState)
        params = {}
        if 'saveName' in state:
            params['saveName'] = state['saveName']
        if 'temp_list_name' in state:
            params['tempListName'] = state['temp_list_name']
        return params

    def give_up_and_save(self, user, tablenum, listname):
        logger.debug(
            u'table %s - User %s called give_up_and_save with params: %s',
            tablenum, user, listname)
        if self.give_up(user, tablenum):
            return self.save(user, tablenum, listname)
        return {'success': False}

    def validate_can_save(self, tablenum, listname, wgm, state):
        """
        If we cannot save, return a string with an error message,
        otherwise return None.

        """

        # make sure the list name is not just all whitespace
        s = re.search(r"\S", listname)
        if s is None:
            return _('Please enter a valid list name!')
        if not wgm.playerType == GenericTableGameModel.SINGLEPLAYER_GAME:
            return _('Your game must be a single player game!')
        if state['quizGoing']:
            # TODO actually should check if time ran out
            # this seems like an arbitrary limitation but it makes
            # things a lot easier. we can change this later.
            logger.warning('Unable to save, quiz is going.')
            return _('You can only save the game at the end of a round.')
        if not wgm.word_list:
            return _('The word list associated with this table seems to have '
                     'been deleted. Please load or create a new list.')

    def save(self, user, tablenum, listname):
        logger.debug(u'user=%s, tablenum=%s, listname=%s, event=save',
                     user, tablenum, listname)
        wgm = self.get_wgm(tablenum)
        if not wgm:
            return {'success': False, 'info': _('That table does not exist!')}
        state = json.loads(wgm.currentGameState)
        err = self.validate_can_save(tablenum, listname, wgm, state)
        if err is not None:
            return {'success': False, 'info': err}
        # If we are continuing a word list, just save the progress.
        return self.save_word_list_result(
            wgm.word_list, listname, state, wgm, user,
            # XXX: This condition is a bit confusing, but seems right:
            make_permanent_list=wgm.word_list.is_temporary)

    def save_word_list_result(self, word_list, listname, state, wgm, user,
                              make_permanent_list=False):
        """
        Save a word list, return a response object.

        """
        ret = {'success': False}
        profile_modified = False
        # Note: this could be a rename (the old list would be lost).
        # Maybe we want a way to "save as" another list; think about
        # a list copy.
        word_list.name = listname
        logger.debug(u'Saving word_list, name is %s (%s)', word_list.name,
                     type(word_list.name))
        if make_permanent_list:
            word_list.is_temporary = False
            profile = user.aerolithprofile
            if profile.member:
                limit = settings.SAVE_LIST_LIMIT_MEMBER
            else:
                limit = settings.SAVE_LIST_LIMIT_NONMEMBER

            exceeded_limit_message = _(
                'Unable to save list because you have gone over the '
                'number of total alphagrams limit (%d). You can '
                'increase this limit by becoming a supporter!') % limit
            if (profile.wordwallsSaveListSize + word_list.numAlphagrams >
                    limit):
                ret['info'] = exceeded_limit_message
                return ret
            profile.wordwallsSaveListSize += word_list.numAlphagrams
            profile_modified = True

        try:
            word_list.save()
        except IntegrityError:
            # There's already a word list with this name, perhaps?
            ret['info'] = _('Cannot save - you already have a word list '
                            'with that name!')
            return ret
        except Exception:
            logger.exception('Error saving.')
            ret['info'] = _('Unable to save for another reason.')
        ret['success'] = True
        ret['listname'] = listname
        state['saveName'] = listname
        wgm.currentGameState = json.dumps(state)
        wgm.save()
        if profile_modified:
            profile.save()
        return ret

    def do_quiz_end_actions(self, state, tablenum, wgm):
        state['quizGoing'] = False
        state['justCreatedFirstMissed'] = False
        # copy missed alphagrams to state['missed']
        missed_indices = set()
        for w in state['answerHash']:
            missed_indices.add(state['answerHash'][w][1])
            # [0] is the alphagram, [1] is the index in origQuestions
        missed = json.loads(wgm.word_list.missed)
        missed.extend(missed_indices)
        word_list = wgm.word_list
        word_list.missed = json.dumps(missed)
        word_list.numMissed = len(missed)

        # check if the list is unique
        uniqueMissed = set(missed)
        if len(uniqueMissed) != len(missed):
            logger.error("missed list is not unique!! %s %s", uniqueMissed,
                         missed)
            #raise Exception('Missed list is not unique')

        logger.info("%d missed this round, %d missed total",
                    len(missed_indices), len(missed))
        if state['gameType'] == 'challenge':
            state['gameType'] = 'challengeOver'
            self.create_challenge_leaderboard_entry(state, tablenum)

        # check if we've gone thru the quiz once.
        if word_list.questionIndex > word_list.numCurAlphagrams - 1:
            if not word_list.goneThruOnce:
                word_list.goneThruOnce = True
                state['justCreatedFirstMissed'] = True
                logger.debug('Creating first missed list from missed')
                word_list.firstMissed = word_list.missed
                word_list.numFirstMissed = word_list.numMissed
        try:
            word_list.save()
        except Exception:
            logger.exception('Error saving.')

    def create_challenge_leaderboard_entry(self, state, tablenum):
        """
        Create a challenge leaderboard entry for this particular game
        state and table number.

        """
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
            qualify_for_award = state.get('qualifyForAward', False)

            lbe = DailyChallengeLeaderboardEntry(
                user=wgm.host, score=score, board=lb,
                timeRemaining=timeRemaining, qualifyForAward=qualify_for_award)
            # XXX: 500 here, integrity error, much more common than lb.save
            lbe.save()
            if (len(state['answerHash']) > 0 and dc.name.name in
                    ("Today's 7s", "Today's 8s")):
                # if the user missed some 7s or 8s
                self.add_dc_missed_bingos(state, dc, wgm)

    def add_dc_missed_bingo(self, challenge, alphagram):
        """
            Adds a Daily Challenge Missed Bingo in a thread-safe manner.
        """
        try:
            dcmb = DailyChallengeMissedBingos.objects.select_for_update().get(
                challenge=challenge,
                alphagram_string=alphagram)
            dcmb.numTimesMissed += 1
        except DailyChallengeMissedBingos.DoesNotExist:
            dcmb = DailyChallengeMissedBingos(challenge=challenge,
                                              alphagram_string=alphagram)
            dcmb.numTimesMissed = 1
        try:
            dcmb.save()
        except IntegrityError:
            logger.exception('Caught MissedBingos IntegrityError')
            # It means another thread created it (in the except above).
            # We should start over, but now that we know the object exists,
            # we can use select_for_update without fear.
            dcmb = DailyChallengeMissedBingos.objects.select_for_update().get(
                challenge=challenge, alphagram_string=alphagram)
            dcmb.numTimesMissed += 1
            dcmb.save()

    def add_dc_missed_bingos(self, state, dc, wgm):
        orig_qs_obj = json.loads(wgm.word_list.origQuestions)
        missed_alphas = set()
        for missed in state['answerHash']:
            question, idx = state['answerHash'][missed]
            question = orig_qs_obj[idx]
            missed_alphas.add(question['q'])
        for alpha in missed_alphas:
            self.add_dc_missed_bingo(dc, alpha)

    def mark_missed(self, question_index, tablenum, user):
        try:
            question_index = int(question_index)
        except (ValueError, TypeError):
            return False
        wgm = self.get_wgm(tablenum)
        if not wgm:
            return _('No table #%s exists') % tablenum
        word_list = wgm.word_list
        missed = json.loads(word_list.missed)
        state = json.loads(wgm.currentGameState)
        if question_index in set(missed):
            # Already missed, user should not be able to mark it missed.
            return False
        missed.append(question_index)
        word_list.missed = json.dumps(missed)
        word_list.numMissed += 1
        if state.get('justCreatedFirstMissed'):
            logger.debug('Also adding to first missed count')
            # Also add to first missed count.
            first_missed = json.loads(word_list.firstMissed)
            if question_index not in set(first_missed):
                first_missed.append(question_index)
                word_list.numFirstMissed += 1
                word_list.firstMissed = json.dumps(first_missed)

        word_list.save()
        logger.debug('Missed: %s', word_list.missed)
        return True

    def guess(self, guess_str, tablenum, user):
        """ Handle a guess submission from the front end. """
        guess_str = guess_str.upper()
        wgm = self.get_wgm(tablenum)
        last_correct = ''
        if not wgm:
            return
        state = json.loads(wgm.currentGameState)
        state_modified = False
        if not state['quizGoing']:
            logger.info('Guess came in after quiz ended.')
            return
        # Otherwise, let's process the guess.
        if self.did_timer_run_out(state):
            state['timeRemaining'] = 0
            state_modified = True
            logger.info('Timer ran out, end quiz.')
            self.do_quiz_end_actions(state, tablenum, wgm)
            # Save state back to game.
        elif guess_str in state['answerHash']:
            alpha = state['answerHash'][guess_str]
            # state['answerHash'] is modified here
            del state['answerHash'][guess_str]
            state_modified = True
            if len(state['answerHash']) == 0:
                time_remaining = (state['quizStartTime'] +
                                  state['timerSecs']) - time.time()
                if time_remaining < 0:
                    time_remaining = 0
                state['timeRemaining'] = time_remaining
                self.do_quiz_end_actions(state, tablenum, wgm)
            last_correct = alpha[0]
        elif guess_str in state.get('originalAnswerHash', {}):
            # It's possible that the guess is in the answer hash that
            # existed at the beginning of the quiz, but the front end
            # never got the message that it was solved, due to Internet
            # connectivity issues.
            # In this case, we should advise the front end to mark the
            # question correct.
            logger.info('event=guess-not-correct guess=%s', guess_str)
            last_correct = state['originalAnswerHash'][guess_str][0]
            return {'going': state['quizGoing'],
                    'word': guess_str,
                    'alphagram': last_correct,
                    'already_solved': True}
        if state_modified:
            wgm.currentGameState = json.dumps(state)
            wgm.save()
        return {'going': state['quizGoing'],
                'word': guess_str,
                'alphagram': last_correct,
                'already_solved': False}

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
