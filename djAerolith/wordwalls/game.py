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
import datetime
import copy
import logging
import re
import time
from typing import List

from django.conf import settings
from django.db import IntegrityError
from django.utils.translation import gettext as _
from django.utils import timezone
import waffle

from base.models import Lexicon
from base.forms import SavedListForm
from lib.domain import Questions
from lib.wdb_interface.wdb_helper import (
    questions_from_alpha_dicts,
    questions_from_probability_range,
    word_search,
    WDBError,
)
from lib.wdb_interface.word_searches import temporary_list_name
import rpc.wordsearcher.searcher_pb2 as pb
from wordwalls.challenges import generate_dc_questions, toughies_challenge_date
from base.models import WordList
from tablegame.models import GenericTableGameModel
from wordwalls.models import (
    DailyChallenge,
    DailyChallengeLeaderboard,
    DailyChallengeLeaderboardEntry,
    DailyChallengeMissedBingos,
    DailyChallengeName,
    WordwallsGameModel,
)

logger = logging.getLogger(__name__)


class GameInitException(Exception):
    pass


class WordwallsGame(object):
    def _initial_state(self):
        """Return an initial state object, for a brand new game."""
        return {
            "answerHash": {},
            "originalAnswerHash": {},
            "questionsToPull": settings.WORDWALLS_QUESTIONS_PER_ROUND,
            "quizGoing": False,
            "quizStartTime": 0,
            "numAnswersThisRound": 0,
            "gameType": "regular",
            "solvers": {},
        }

    def maybe_modify_list_name(self, list_name, user):
        """
        Given a temporary `list_name` for a `user`, modify it if user
        already has a list with this list name. We don't want to
        silently overwrite lists.

        """
        orig_list_name = list_name
        user_lists = WordList.objects.filter(user=user, is_temporary=False).filter(
            name=list_name
        )
        repeat = 1
        while user_lists.count() > 0:
            list_name = "{0} ({1})".format(orig_list_name, repeat)
            user_lists = WordList.objects.filter(user=user, is_temporary=False).filter(
                name=list_name
            )
            repeat += 1
        return list_name

    def create_or_update_game_instance(
        self, host, lex, word_list, use_table, multiplayer, **state_kwargs
    ):
        state = self._initial_state()
        if state_kwargs.get("temp_list_name"):
            state_kwargs["temp_list_name"] = self.maybe_modify_list_name(
                state_kwargs["temp_list_name"], host
            )
        for param in state_kwargs:
            state[param] = state_kwargs[param]
        if state["questionsToPull"] is None:
            state["questionsToPull"] = settings.WORDWALLS_QUESTIONS_PER_ROUND

        if multiplayer:
            player_type = GenericTableGameModel.MULTIPLAYER_GAME
        else:
            player_type = GenericTableGameModel.SINGLEPLAYER_GAME

        def new_wgm():
            return WordwallsGameModel(
                host=host,
                currentGameState=json.dumps(state),
                gameType=GenericTableGameModel.WORDWALLS_GAMETYPE,
                playerType=player_type,
                lexicon=lex,
                word_list=word_list,
            )

        old_word_list = None
        if use_table is None:
            wgm = new_wgm()
        else:
            wgm = self.get_wgm(tablenum=use_table, lock=True)
            old_word_list = wgm.word_list
            if multiplayer and wgm.host != host:
                # It's a multiplayer game, but we are not the host and thus
                # cannot load a new list into this table.
                wgm = new_wgm()
            elif not multiplayer and wgm.is_multiplayer():
                # Game used to be a multiplayer game, and now we want to
                # make it a single player game. Instead of kicking everyone
                # out, create a new table.
                wgm = new_wgm()
            else:
                wgm.currentGameState = json.dumps(state)
                wgm.lexicon = lex
                wgm.word_list = word_list
                if "challenge" in state.get("gameType"):
                    # Do not allow multiplayer!
                    if multiplayer:
                        raise GameInitException(
                            "Cannot do a daily challenge in multiplayer mode."
                        )
                wgm.playerType = player_type
        wgm.save()
        if old_word_list and old_word_list.is_temporary:
            # This word list is old. Check to make sure it's in no tables.
            if WordwallsGameModel.objects.filter(word_list=old_word_list).count() == 0:
                logger.info("Deleting old, temporary word list: %s", old_word_list)
                old_word_list.delete()
            else:
                logger.info("Old word list is still in use, not deleting...")
        # from wordwalls.signal_handlers import game_important_save
        # game_important_save.send(sender=self.__class__, instance=wgm)
        return wgm

    def initialize_word_list(
        self, questions, lexicon, user, category=WordList.CATEGORY_ANAGRAM
    ):
        """
        Initializes a word list with the given questions and
        returns it.

        questions - An instance of Questions.
        lexicon - An instance of base.Lexicon
        user - The user.

        """
        if questions.size() == 0:
            raise GameInitException("No questions were found.")
        wl = WordList()
        wl.initialize_list(
            questions.to_python(),
            lexicon,
            user,
            shuffle=True,
            category=category,
        )
        return wl

    def get_dc(self, ch_date, ch_lex, ch_name):
        """
        Gets a challenge with date, lex, name.

        """
        dc = DailyChallenge.objects.get(date=ch_date, lexicon=ch_lex, name=ch_name)
        qs = Questions()
        qs.set_from_json(dc.alphagrams)
        qs.shuffle()
        secs = dc.seconds
        return qs, secs, dc

    def initialize_daily_challenge(
        self, user, ch_lex, ch_name, ch_date, use_table=None
    ):
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
            if ch_name.name == DailyChallengeName.WEEKS_BINGO_TOUGHIES:
                raise GameInitException(
                    "Unable to create Toughies challenge. If this is a new "
                    "lexicon, please wait until Tuesday for new words to be "
                    "available."
                )
            raise GameInitException(
                "Unable to create daily challenge {0}".format(ch_name)
            )
        qs, secs, dc = ret
        list_category = WordList.CATEGORY_ANAGRAM
        if dc.category == DailyChallenge.CATEGORY_BUILD:
            list_category = WordList.CATEGORY_BUILD
        wl = self.initialize_word_list(qs, ch_lex, user, list_category)

        visible_name = dc.visible_name
        if not visible_name:
            visible_name = dc.name.name

        temp_list_name = "{0} {1} - {2}".format(
            ch_lex.lexiconName, visible_name, ch_date.strftime("%Y-%m-%d")
        )
        wgm = self.create_or_update_game_instance(
            user,
            ch_lex,
            wl,
            use_table,
            False,
            # Extra parameters to be put in 'state'
            gameType="challenge",
            questionsToPull=qs.size(),
            challengeId=dc.pk,
            timerSecs=secs,
            temp_list_name=temp_list_name,
            qualifyForAward=qualify_for_award,
        )
        return wgm.pk  # the table number

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
                logger.info("Empty questions.")
                return None
            ch_category = DailyChallenge.CATEGORY_ANAGRAM
            if qs.build_mode:
                ch_category = DailyChallenge.CATEGORY_BUILD
            dc = DailyChallenge(
                date=ch_date,
                lexicon=ch_lex,
                name=ch_name,
                seconds=secs,
                alphagrams=qs.to_json(),
                category=ch_category,
            )
            try:
                dc.save()
            except IntegrityError:
                logger.exception("Caught integrity error")
                # This happens rarely if the DC gets generated twice
                # in very close proximity.
                qs, secs, dc = self.get_dc(ch_date, ch_lex, ch_name)

        return qs, secs, dc

    def initialize_by_search_params(
        self,
        user,
        search_description: List[pb.SearchRequest.SearchParam],
        time_secs,
        questions_per_round=None,
        use_table=None,
        multiplayer=None,
    ):
        try:
            lexicon = Lexicon.objects.get(
                lexiconName=search_description[0].stringvalue.value
            )
        except Lexicon.DoesNotExist:
            raise GameInitException("Search description not properly initialized")

        try:
            questions = word_search(search_description)
        except WDBError as e:
            raise GameInitException(e)

        category = WordList.CATEGORY_ANAGRAM
        for sd in search_description:
            if sd.condition == pb.SearchRequest.Condition.DELETED_WORD:
                category = WordList.CATEGORY_TYPING

        wl = self.initialize_word_list(questions, lexicon, user, category)

        wgm = self.create_or_update_game_instance(
            user,
            lexicon,
            wl,
            use_table,
            multiplayer,
            timerSecs=time_secs,
            temp_list_name=temporary_list_name(search_description, lexicon.lexiconName),
            questionsToPull=questions_per_round,
        )
        return wgm.pk  # this is a table number id!

    def initialize_by_raw_questions(
        self,
        lex,
        user,
        raw_questions,
        secs,
        questions_per_round,
        use_table,
        multiplayer,
    ):
        dt = datetime.datetime.today().strftime("%Y-%m-%d %H:%M:%S")
        qs = Questions()
        qs.set_from_list(raw_questions)

        wl = self.initialize_word_list(qs, lex, user)
        wgm = self.create_or_update_game_instance(
            user,
            lex,
            wl,
            use_table,
            multiplayer,
            timerSecs=secs,
            temp_list_name="quiz on {}".format(dt),
            questionsToPull=questions_per_round,
        )
        return wgm.pk

    def initialize_by_named_list(
        self,
        lex,
        user,
        named_list,
        secs,
        questions_per_round=None,
        use_table=None,
        multiplayer=None,
    ):
        qs = json.loads(named_list.questions)
        if named_list.isRange:
            questions = questions_from_probability_range(
                lex, qs[0], qs[1], named_list.wordLength
            )
            wl = self.initialize_word_list(questions, lex, user)
        else:
            # Initialize word list directly.
            wl = WordList()
            wl.initialize_list(qs, lex, user, shuffle=True)

        wgm = self.create_or_update_game_instance(
            user,
            lex,
            wl,
            use_table,
            multiplayer,
            timerSecs=secs,
            temp_list_name=named_list.name,
            questionsToPull=questions_per_round,
        )
        return wgm.pk

    def initialize_by_saved_list(
        self,
        lex,
        user,
        saved_list,
        list_option,
        secs,
        questions_per_round=None,
        use_table=None,
        multiplayer=None,
    ):
        if saved_list.user != user:
            # Maybe this isn't a big deal.
            logger.warning(
                "Saved list user does not match user %s %s",
                saved_list.user,
                user,
            )
            raise GameInitException("Saved list user does not match user.")
        if list_option is None:
            logger.warning("Invalid list_option.")
            raise GameInitException("Invalid list option.")

        if (
            list_option == SavedListForm.FIRST_MISSED_CHOICE
            and saved_list.goneThruOnce is False
        ):
            logger.warning(
                "Error, first missed list only valid if player has "
                "gone thru list once."
            )
            raise GameInitException(
                "Cannot quiz on first missed unless you " "have gone through list once."
            )
        temp_list_name = None
        save_name = saved_list.name
        if multiplayer:
            # If this is a multiplayer game, we don't want to save it
            # under the original list at all. Let's make a copy.
            temp_list_name = saved_list.name
            saved_list = saved_list.make_temporary_copy()
            save_name = None

        self.maybe_modify_word_list(saved_list, list_option)
        wgm = self.create_or_update_game_instance(
            user,
            lex,
            saved_list,
            use_table,
            multiplayer,
            timerSecs=secs,
            saveName=save_name,
            temp_list_name=temp_list_name,
            questionsToPull=questions_per_round,
        )
        return wgm.pk  # this is a table number id!

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
        return state.get("challengeId", 0)

    def create_error_message(self, message):
        return {"error": message}

    def start_quiz(self, tablenum, user):
        wgm = self.get_wgm(tablenum)
        if not wgm:
            return self.create_error_message(_("That table does not exist."))
        state = json.loads(wgm.currentGameState)
        if state["quizGoing"]:
            logger.info("The quiz is going, state %s", state)
            # The quiz is running right now; do not attempt to start again
            return self.create_error_message(_("The quiz is currently running."))

        if waffle.switch_is_active("disable_games"):
            return self.create_error_message(
                _(
                    "Please wait a few minutes. Aerolith is currently "
                    "undergoing maintenance."
                )
            )

        if wgm.is_multiplayer():
            if user != wgm.host:
                return self.create_error_message(
                    _(
                        "{user} wants to start the game, but only the host "
                        "{host} can do that."
                    ).format(user=user, host=wgm.host)
                )

        start_message = ""
        word_list = wgm.word_list

        if not word_list:
            return self.create_error_message(
                _(
                    "It appears this word list has been deleted. Please "
                    "load or create a new word list."
                )
            )

        if word_list.questionIndex > word_list.numCurAlphagrams - 1:
            start_message += _("Now quizzing on missed list.") + "\r\n"
            word_list.set_to_missed()
            state["quizGoing"] = False

        if word_list.numCurAlphagrams == 0:
            wgm.currentGameState = json.dumps(state)
            wgm.save()
            return self.create_error_message(
                _("The quiz is done. Please load a new word list!")
            )

        cur_questions_obj = json.loads(word_list.curQuestions)
        idx = word_list.questionIndex
        num_qs_per_round = state["questionsToPull"]
        qs = cur_questions_obj[idx : (idx + num_qs_per_round)]

        start_message += _(
            "These are questions %(qbegin)s through %(qend)s of " "%(qtotal)s."
        ) % {
            "qbegin": idx + 1,
            "qend": len(qs) + idx,
            "qtotal": word_list.numCurAlphagrams,
        }

        word_list.questionIndex += num_qs_per_round
        qs_set = set(qs)
        if len(qs_set) != len(qs):
            logger.error("Question set is not unique!!")
        orig_questions = json.loads(word_list.origQuestions)
        questions, answer_hash = self.load_questions(qs, orig_questions, word_list)

        state["quizGoing"] = True  # start quiz
        state["quizStartTime"] = time.time()
        state["answerHash"] = answer_hash
        state["originalAnswerHash"] = copy.deepcopy(answer_hash)
        state["numAnswersThisRound"] = len(answer_hash)
        state["questions"] = [
            {"a": q["a"], "ws": [w["w"] for w in q["ws"]]} for q in questions
        ]

        wgm.currentGameState = json.dumps(state)

        wgm.save()

        # XXX: Autosave doesn't really do anything for saved lists. It
        # always saves, regardless! Oh well...
        word_list.save()
        game_type = state["gameType"]
        if word_list.category == WordList.CATEGORY_BUILD:
            game_type += "_build"  # This is hell of ghetto.
        elif word_list.category == WordList.CATEGORY_TYPING:
            game_type += "_typing"
        ret = {
            "questions": questions,
            "time": state["timerSecs"],
            "gameType": game_type,
            "serverMsg": start_message,
        }

        return ret

    def load_questions(self, qs, orig_questions, word_list):
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
        alphagrams_to_fetch = []
        index_map = {}
        for i in qs:
            alphagrams_to_fetch.append(orig_questions[i])
            index_map[orig_questions[i]["q"]] = i

        if word_list.category != WordList.CATEGORY_TYPING:
            questions = questions_from_alpha_dicts(
                word_list.lexicon, alphagrams_to_fetch
            )
        else:
            questions = Questions()
            questions.set_from_list(alphagrams_to_fetch)
        answer_hash = {}
        ret_q_array = []
        for q in questions.questions_array():
            words = []
            alphagram_str = q.alphagram.alphagram
            i = index_map[alphagram_str]
            if len(q.answers) == 0:
                # There may be no answers because this question was deleted
                # in the newer lexicon, and the lists were migrated over,
                # or something of that nature.
                continue
            for w in q.answers:
                words.append(
                    {
                        "w": w.word,
                        "d": w.definition,
                        "fh": w.front_hooks,
                        "bh": w.back_hooks,
                        "s": w.lexicon_symbols,
                        "ifh": w.inner_front_hook,
                        "ibh": w.inner_back_hook,
                    }
                )
                answer_hash[w.word] = alphagram_str, i
            ret_q_array.append(
                {
                    "a": alphagram_str,
                    "ws": words,
                    "p": q.alphagram.probability,
                    "df": q.alphagram.difficulty,
                    "idx": i,
                }
            )
        return ret_q_array, answer_hash

    def did_timer_run_out(self, state):
        # internal function; not meant to be called by the outside
        return (state["quizStartTime"] + state["timerSecs"]) < time.time()

    def get_wgm(self, tablenum, lock=True):
        """
        Get word game model.
        :lock Should lock if this is a write operation. This is because
        the object can be updated simultaneously from various places :/
        """
        try:
            if lock:
                wgm = WordwallsGameModel.objects.select_for_update().get(pk=tablenum)
            else:
                wgm = WordwallsGameModel.objects.get(pk=tablenum)
        except WordwallsGameModel.DoesNotExist:
            return None
        return wgm

    def check_game_ended(self, tablenum):
        # Called when javascript tells the server that time ran out on
        # its end.
        # XXX: This function could be called multiple times from different
        # clients. The lock in get_wgm should do the right thing here,
        # but we should figure out how to test this.
        wgm = self.get_wgm(tablenum)
        if not wgm:
            return _("Table does not exist.")

        state = json.loads(wgm.currentGameState)
        timer_ran_out = self.did_timer_run_out(state)
        quiz_going = state["quizGoing"]

        def end_game():
            state["timeRemaining"] = 0
            self.do_quiz_end_actions(state, tablenum, wgm)
            wgm.currentGameState = json.dumps(state)
            wgm.save()

        if timer_ran_out and quiz_going:
            # the game is over! mark it so.
            end_game()
            return True
        now = time.time()
        logger.info(
            "Got game ended but did not actually end: "
            "start_time=%f timer=%f now=%f quizGoing=%s elapsed=%s",
            state["quizStartTime"],
            state["timerSecs"],
            now,
            state["quizGoing"],
            now - state["quizStartTime"],
        )
        if not timer_ran_out:
            # Log this, but end the game anyway. What else are we going
            # to do? Otherwise, front end just gets stuck.
            logger.info("event=ran-out-too-early")
            end_game()
            return True
        if not quiz_going:
            logger.info("event=round-is-over")
            return _("The round is over.")

        return False

    def allow_give_up(self, wgm, user):
        """
        Determine whether to allow giving up. For a single player it
        should always be true. For multiplayer:
            - Give up if it's the host
            - Otherwise we should let the other players know so and so
            wants to give up.

        """
        state = json.loads(wgm.currentGameState)
        if state["quizGoing"] is False:
            return _("The quiz is" "nt going, can" "t give up.")
        if not wgm.is_multiplayer():
            return True
        if user == wgm.host:
            return True
        return _(
            "{user} wants to give up, but only the host {host} " "can do that."
        ).format(user=user, host=wgm.host)

    def give_up(self, user, tablenum):
        wgm = self.get_wgm(tablenum)
        if not wgm:
            return False
        allowed = self.allow_give_up(wgm, user)
        if allowed is True:
            state = json.loads(wgm.currentGameState)
            state["timeRemaining"] = 0
            self.do_quiz_end_actions(state, tablenum, wgm)
            wgm.currentGameState = json.dumps(state)
            wgm.save()
            return True
        # Otherwise, return the reason we can't give up.
        return allowed

    def get_add_params(self, tablenum):
        wgm = self.get_wgm(tablenum, lock=False)
        if not wgm:
            return {}

        state = json.loads(wgm.currentGameState)
        params = {}
        if "saveName" in state:
            params["saveName"] = state["saveName"]
        if "temp_list_name" in state:
            params["tempListName"] = state["temp_list_name"]
        params["multiplayer"] = wgm.is_multiplayer()
        return params

    def give_up_and_save(self, user, tablenum, listname):
        logger.debug(
            "table %s - User %s called give_up_and_save with params: %s",
            tablenum,
            user,
            listname,
        )
        if self.give_up(user, tablenum) is True:
            return self.save(user, tablenum, listname)

    def validate_can_save(self, tablenum, listname, wgm, state):
        """
        If we cannot save, return a string with an error message,
        otherwise return None.

        """

        # make sure the list name is not just all whitespace
        s = re.search(r"\S", listname)
        if s is None:
            return _("Please enter a valid list name!")
        if wgm.is_multiplayer():
            return _("Cannot save - your game must be a single player game!")
        if state["quizGoing"]:
            # TODO actually should check if time ran out
            # this seems like an arbitrary limitation but it makes
            # things a lot easier. we can change this later.
            logger.warning("Unable to save, quiz is going.")
            return _("You can only save the game at the end of a round.")
        if not wgm.word_list:
            return _(
                "The word list associated with this table seems to have "
                "been deleted. Please load or create a new list."
            )

    def save(self, user, tablenum, listname):
        logger.info(
            "user=%s, tablenum=%s, listname=%s, event=save",
            user,
            tablenum,
            listname,
        )
        wgm = self.get_wgm(tablenum)
        if not wgm:
            return {"success": False, "info": _("That table does not exist!")}
        state = json.loads(wgm.currentGameState)
        err = self.validate_can_save(tablenum, listname, wgm, state)
        if err is not None:
            return {"success": False, "info": err}
        # If we are continuing a word list, just save the progress.
        return self.save_word_list_result(
            wgm.word_list,
            listname,
            state,
            wgm,
            user,
            # XXX: This condition is a bit confusing, but seems right:
            make_permanent_list=wgm.word_list.is_temporary,
        )

    def save_word_list_result(
        self, word_list, listname, state, wgm, user, make_permanent_list=False
    ):
        """
        Save a word list, return a response object.

        """
        ret = {"success": False}
        profile_modified = False
        # Note: this could be a rename (the old list would be lost).
        # Maybe we want a way to "save as" another list; think about
        # a list copy.
        word_list.name = listname
        logger.info(
            "Saving word_list, name is %s (%s)",
            word_list.name,
            type(word_list.name),
        )
        if make_permanent_list:
            word_list.is_temporary = False
            profile = user.aerolithprofile
            if profile.member:
                limit = settings.SAVE_LIST_LIMIT_MEMBER
            else:
                limit = settings.SAVE_LIST_LIMIT_NONMEMBER

            exceeded_limit_message = (
                _(
                    "Unable to save list because you have gone over the "
                    "number of total alphagrams limit (%d). You can "
                    "increase this limit by becoming a supporter!"
                )
                % limit
            )
            if profile.wordwallsSaveListSize + word_list.numAlphagrams > limit:
                ret["info"] = exceeded_limit_message
                return ret
            profile.wordwallsSaveListSize += word_list.numAlphagrams
            profile_modified = True

        try:
            word_list.save()
        except IntegrityError:
            # There's already a word list with this name, perhaps?
            ret["info"] = _(
                "Cannot save - you already have a word list " "with that name!"
            )
            return ret
        except Exception:
            logger.exception("Error saving.")
            ret["info"] = _("Unable to save for another reason.")
        ret["success"] = True
        ret["listname"] = listname
        state["saveName"] = listname
        wgm.currentGameState = json.dumps(state)
        wgm.save()
        if profile_modified:
            profile.save()
        return ret

    def do_quiz_end_actions(self, state, tablenum, wgm):
        state["quizGoing"] = False
        state["justCreatedFirstMissed"] = False
        # copy missed alphagrams to state['missed']
        missed_indices = set()
        for w in state["answerHash"]:
            missed_indices.add(state["answerHash"][w][1])
            # [0] is the alphagram, [1] is the index in origQuestions
        missed = json.loads(wgm.word_list.missed)
        missed.extend(missed_indices)
        word_list = wgm.word_list
        word_list.missed = json.dumps(missed)
        word_list.numMissed = len(missed)

        # check if the list is unique
        uniqueMissed = set(missed)
        if len(uniqueMissed) != len(missed):
            logger.error("missed list is not unique!! %s %s", uniqueMissed, missed)
            # raise Exception('Missed list is not unique')

        logger.info(
            "%d missed this round, %d missed total",
            len(missed_indices),
            len(missed),
        )
        if state["gameType"] == "challenge":
            state["gameType"] = "regular"
            self.create_challenge_leaderboard_entry(state, tablenum)
        # clear solvers so it doesn't grow out of control for large lists
        state["solvers"] = {}

        # check if we've gone thru the quiz once.
        if word_list.questionIndex > word_list.numCurAlphagrams - 1:
            if not word_list.goneThruOnce:
                word_list.goneThruOnce = True
                state["justCreatedFirstMissed"] = True
                logger.debug("Creating first missed list from missed")
                word_list.firstMissed = word_list.missed
                word_list.numFirstMissed = word_list.numMissed
        try:
            word_list.save()
        except Exception:
            logger.exception("Error saving.")

    def create_challenge_leaderboard_entry(self, state, tablenum):
        """
        Create a challenge leaderboard entry for this particular game
        state and table number.

        """
        # First create a leaderboard if one doesn't exist for this challenge.
        try:
            dc = DailyChallenge.objects.get(pk=state["challengeId"])
        except DailyChallenge.DoesNotExist:
            return  # this shouldn't happen
        try:
            lb = DailyChallengeLeaderboard.objects.get(challenge=dc)
        except DailyChallengeLeaderboard.DoesNotExist:
            # doesn't exist
            lb = DailyChallengeLeaderboard(
                challenge=dc, maxScore=state["numAnswersThisRound"]
            )
            # XXX: 500 here, integrity error, very rare.
            lb.save()
        wgm = WordwallsGameModel.objects.get(pk=tablenum)
        # Now create an entry; if one exists, don't modify it, just return.

        try:
            lbe = DailyChallengeLeaderboardEntry.objects.get(user=wgm.host, board=lb)
            # If it exists, we're here. don't update the leaderboard
            # entry because we can only do the quiz once.
            return

        except DailyChallengeLeaderboardEntry.DoesNotExist:
            score = state["numAnswersThisRound"] - len(state["answerHash"])
            if "timeRemaining" in state:
                timeRemaining = int(round(state["timeRemaining"]))
                # If there was time remaining, it would get written into the
                # state inside the guess processing function.
            else:
                # Else, nothing would write it into the state.
                timeRemaining = 0
            qualify_for_award = state.get("qualifyForAward", False)
            wrong_answers = state.get("wrongAnswers", 0)
            lbe = DailyChallengeLeaderboardEntry(
                user=wgm.host,
                score=score,
                board=lb,
                wrong_answers=wrong_answers,
                timeRemaining=timeRemaining,
                qualifyForAward=qualify_for_award,
            )
            # XXX: 500 here, integrity error, much more common than lb.save
            lbe.save()
            if len(state["answerHash"]) > 0 and dc.name.name in (
                "Today's 7s",
                "Today's 8s",
            ):
                # if the user missed some 7s or 8s
                self.add_dc_missed_bingos(state, dc, wgm)

    def add_dc_missed_bingo(self, challenge, alphagram):
        """
        Adds a Daily Challenge Missed Bingo in a thread-safe manner.
        """
        try:
            dcmb = DailyChallengeMissedBingos.objects.select_for_update().get(
                challenge=challenge, alphagram_string=alphagram
            )
            dcmb.numTimesMissed += 1
        except DailyChallengeMissedBingos.DoesNotExist:
            dcmb = DailyChallengeMissedBingos(
                challenge=challenge, alphagram_string=alphagram
            )
            dcmb.numTimesMissed = 1
        try:
            dcmb.save()
        except IntegrityError:
            logger.exception("Caught MissedBingos IntegrityError")
            # It means another thread created it (in the except above).
            # We should start over, but now that we know the object exists,
            # we can use select_for_update without fear.
            dcmb = DailyChallengeMissedBingos.objects.select_for_update().get(
                challenge=challenge, alphagram_string=alphagram
            )
            dcmb.numTimesMissed += 1
            dcmb.save()

    def add_dc_missed_bingos(self, state, dc, wgm):
        orig_qs_obj = json.loads(wgm.word_list.origQuestions)
        missed_alphas = set()
        for missed in state["answerHash"]:
            question, idx = state["answerHash"][missed]
            question = orig_qs_obj[idx]
            missed_alphas.add(question["q"])
        for alpha in missed_alphas:
            self.add_dc_missed_bingo(dc, alpha)

    def mark_missed(self, question_index, tablenum, user):
        try:
            question_index = int(question_index)
        except (ValueError, TypeError):
            return False
        wgm = self.get_wgm(tablenum)
        if not wgm:
            return _("No table #%s exists") % tablenum
        word_list = wgm.word_list
        missed = json.loads(word_list.missed)
        state = json.loads(wgm.currentGameState)
        if question_index in set(missed):
            # Already missed, user should not be able to mark it missed.
            return False
        missed.append(question_index)
        word_list.missed = json.dumps(missed)
        word_list.numMissed += 1
        if state.get("justCreatedFirstMissed"):
            logger.debug("Also adding to first missed count")
            # Also add to first missed count.
            first_missed = json.loads(word_list.firstMissed)
            if question_index not in set(first_missed):
                first_missed.append(question_index)
                word_list.numFirstMissed += 1
                word_list.firstMissed = json.dumps(first_missed)

        word_list.save()
        logger.debug("Missed: %s", word_list.missed)
        return True

    def add_to_solvers(self, state, guess, username):
        if "solvers" not in state:
            state["solvers"] = {}
        state["solvers"][guess] = username

    def answer_list(self, tablenum):
        wgm = self.get_wgm(tablenum)
        if not wgm:
            return None
        state = json.loads(wgm.currentGameState)
        if not state["quizGoing"]:
            return None
        time_remaining = (state["quizStartTime"] + state["timerSecs"]) - time.time()
        questions = state.get("questions")
        return {"questions": questions, "time_remaining": time_remaining}

    def guess(self, guess_str, tablenum, user, *, sleep=None, wrong_answers=0):
        """Handle a guess submission from the front end."""
        logger.debug("User %s guessed %s (wrong=%s)", user, guess_str, wrong_answers)
        guess_str = guess_str.upper()
        wgm = self.get_wgm(tablenum)
        last_correct = ""
        if not wgm:
            return
        state = json.loads(wgm.currentGameState)
        state_modified = False
        if not state["quizGoing"]:
            logger.info("Guess came in after quiz ended.")
            return
        # Otherwise, let's process the guess.
        if self.did_timer_run_out(state):
            state["timeRemaining"] = 0
            state["wrongAnswers"] = wrong_answers
            state_modified = True
            logger.info("Timer ran out, end quiz.")
            self.do_quiz_end_actions(state, tablenum, wgm)
            # Save state back to game.
        elif guess_str in state["answerHash"]:
            alpha = state["answerHash"][guess_str]
            # state['answerHash'] is modified here
            del state["answerHash"][guess_str]
            state["wrongAnswers"] = wrong_answers
            self.add_to_solvers(state, guess_str, user.username)
            state_modified = True
            if len(state["answerHash"]) == 0:
                time_remaining = (
                    state["quizStartTime"] + state["timerSecs"]
                ) - time.time()
                if time_remaining < 0:
                    time_remaining = 0
                state["timeRemaining"] = time_remaining
                self.do_quiz_end_actions(state, tablenum, wgm)
            last_correct = alpha[0]
        elif guess_str in state.get("originalAnswerHash", {}):
            # Consider removing this.
            # It's possible that the guess is in the answer hash that
            # existed at the beginning of the quiz, but the front end
            # never got the message that it was solved, due to Internet
            # connectivity issues.
            # In this case, we should advise the front end to mark the
            # question correct.
            logger.info("event=guess-not-correct guess=%s", guess_str)
            last_correct = state["originalAnswerHash"][guess_str][0]
            return {
                "going": state["quizGoing"],
                "word": guess_str,
                "alphagram": last_correct,
                "solver": state["solvers"].get(guess_str, "Anonymous"),
                "already_solved": True,
            }
        if sleep:  # Only used for tests!
            time.sleep(sleep)
        if state_modified:
            wgm.currentGameState = json.dumps(state)
            wgm.save()
        return {
            "going": state["quizGoing"],
            "word": guess_str,
            "alphagram": last_correct,
            "solver": user.username,
            "already_solved": False,
        }

    def allow_access(self, user, tablenum):
        wgm = self.get_wgm(tablenum, lock=False)
        if not wgm:
            return False
        if wgm.is_multiplayer():
            # TODO unless there is an invite list, etc in the future
            return True
        # else
        if user != wgm.host:  # single player, return false!
            return False
        return True

    def is_multiplayer(self, tablenum):
        wgm = self.get_wgm(tablenum, lock=False)
        if not wgm:
            return False
        return wgm.is_multiplayer()

    def midgame_state(self, tablenum):
        """
        Get the game state while in the middle of the game. This
        function may be later reused even when starting a game. This is
        for socket broadcasting to all users in a multiplayer table.

        """

        state = self.state(tablenum)

        return {
            "going": state["quizGoing"],
            "time": state["timerSecs"] - (time.time() - state["quizStartTime"]),
            "gameType": state["gameType"],
        }

    def state(self, tablenum):
        """Get the state."""
        wgm = self.get_wgm(tablenum, lock=False)
        state = json.loads(wgm.currentGameState)
        return state
