# -*- coding: utf-8 -*-

"""
A class mostly to test the logic for wordwalls/game.py

"""
import mock
import re
import json
import logging
from datetime import date

from django.test import TestCase
from django.contrib.auth.models import User
from django.test.utils import override_settings
from django.utils import timezone
from django.db import connection

from base.forms import SavedListForm
from wordwalls.game import WordwallsGame, GameInitException
from wordwalls.models import DailyChallengeName, NamedList, DailyChallenge
from wordwalls.tests.mixins import WordListAssertMixin
from lib.word_searches import SearchDescription
from base.models import Lexicon, WordList


logger = logging.getLogger(__name__)


class WordwallsBasicLogicTestBase(TestCase, WordListAssertMixin):
    fixtures = ['test/lexica.yaml',
                'test/users.json',
                'test/profiles.json',
                'test/word_lists.json']

    def setUp(self):
        cursor = connection.cursor()
        cursor.execute("select setval('%s_id_seq', %d, True)" % (
            'wordwalls_savedlist', 123456))

    def setup_quiz(self, p_min=10, p_max=90, length=8):
        """
        A helper function to start a quiz.
        """
        wwg = WordwallsGame()
        user = User.objects.get(username='cesar')
        lex = Lexicon.objects.get(lexiconName='America')
        search = [
            SearchDescription.lexicon(lex),
            SearchDescription.length(length, length),
            SearchDescription.probability_range(p_min, p_max)
        ]
        logger.debug('In setup_quiz, word lists: %s', WordList.objects.all())
        table_id = wwg.initialize_by_search_params(user, search, 240)
        return table_id, user


class WordwallsBasicLogicTest(WordwallsBasicLogicTestBase):

    def test_quiz_params_correct(self):
        table_id, user = self.setup_quiz()
        wwg = WordwallsGame()
        params = wwg.start_quiz(table_id, user)
        self.assertEqual(len(params['questions']), 50)
        self.assertEqual(params['time'], 240)
        self.assertEqual(params['gameType'], 'regular')
        self.assertEqual(params['serverMsg'],
                         'These are questions 1 through 50 of 81.')
        guess_state = wwg.guess('CATS', table_id, user)
        self.assertTrue(guess_state['going'])
        self.assertEqual(guess_state['alphagram'], '')

    @mock.patch.object(WordwallsGame, 'did_timer_run_out')
    def test_quiz_ends_after_time(self, timer_ran_out):
        # Mock timer running out by the time the guess comes in.
        timer_ran_out.return_value = True
        table_id, user = self.setup_quiz()
        wwg = WordwallsGame()
        wwg.start_quiz(table_id, user)
        guess_state = wwg.guess('CATS', table_id, user)
        self.assertFalse(guess_state['going'])
        self.assertEqual(guess_state['alphagram'], '')
        wgm = wwg.get_wgm(table_id)
        state = json.loads(wgm.currentGameState)
        self.assertFalse(state['quizGoing'])

    def test_word_list_created(self):
        logger.debug('In test_word_list_created')
        table_id, user = self.setup_quiz()
        wwg = WordwallsGame()
        wgm = wwg.get_wgm(table_id)
        word_list = wgm.word_list
        self.assert_wl(word_list, {
            'version': 2,
            'lexicon': Lexicon.objects.get(lexiconName='America'),
            'user': user, 'numAlphagrams': 81, 'numCurAlphagrams': 81,
            'numFirstMissed': 0, 'numMissed': 0, 'goneThruOnce': False,
            'questionIndex': 0, 'is_temporary': True
        })
        # The name should be a random uuid.
        self.assertEqual(len(word_list.name), 32)
        qs = json.loads(word_list.origQuestions)
        self.assertEqual(len(qs), 81)
        # Search for one in particular
        self.assertTrue({'q': 'AEEINRSU', 'a': ['UNEASIER']} in qs)


class WordwallsFullGameLogicTest(WordwallsBasicLogicTestBase):
    """
    Testing full games, make sure word lists save, missed plays, etc.

    """
    def test_solve_all_words(self):
        """
        Test on a word list with more than 50 words. Go to completion,
        ensure quiz on missed, etc.

        """
        table_id, user = self.setup_quiz()
        wwg = WordwallsGame()
        params = wwg.start_quiz(table_id, user)

        def fully_solve_and_assert():
            """Fully solve quiz, asserting various things."""
            valid_words = set()
            for q in params['questions']:
                for w in q['ws']:
                    valid_words.add(w['w'])

            ct = len(valid_words)
            idx = 0
            for w in valid_words:
                idx += 1
                guess_state = wwg.guess(w, table_id, user)
                if idx != ct:
                    self.assertTrue(guess_state['going'])
                else:
                    self.assertFalse(guess_state['going'])      # Quiz ends
                self.assertTrue(guess_state['alphagram'] != '')

        fully_solve_and_assert()   # This solves the first set of 50
        wgm = wwg.get_wgm(table_id)
        word_list = wgm.word_list

        self.assert_wl(word_list, {
            'version': 2,
            'lexicon': Lexicon.objects.get(lexiconName='America'),
            'user': user, 'numAlphagrams': 81, 'numCurAlphagrams': 81,
            'numFirstMissed': 0, 'numMissed': 0, 'goneThruOnce': False,
            'questionIndex': 50, 'is_temporary': True
        })
        # The name should be a random uuid.
        self.assertEqual(len(word_list.name), 32)
        qs = json.loads(word_list.origQuestions)
        self.assertEqual(len(qs), 81)

        # Finish quiz
        params = wwg.start_quiz(table_id, user)
        fully_solve_and_assert()
        wgm = wwg.get_wgm(table_id)
        word_list = wgm.word_list

        self.assert_wl(word_list, {
            'numAlphagrams': 81, 'numCurAlphagrams': 81,
            'numFirstMissed': 0, 'numMissed': 0, 'goneThruOnce': True,
            'questionIndex': 100, 'is_temporary': True
        })

        # Try one more time
        params = wwg.start_quiz(table_id, user)
        self.assertTrue('quiz is done' in params['error'])
        wgm = wwg.get_wgm(table_id)
        word_list = wgm.word_list

        self.assert_wl(word_list, {
            'numAlphagrams': 81, 'numCurAlphagrams': 0,
            'numFirstMissed': 0, 'numMissed': 0, 'goneThruOnce': True,
            'questionIndex': 0, 'is_temporary': True
        })

    def round_1(self):
        table_id, user = self.setup_quiz(p_min=5, p_max=15, length=8)
        wwg = WordwallsGame()
        # Let's guess some of the words from the 5-15 range
        words_to_guess = [
            'ABCDEFGH',     # miss AEROLITE
            'IDOLATER',     # miss TAILORED
            'OUTRAISE', 'SAUTOIRE',
            'ALIENORS', 'AILERONS',
            '',  # miss ANEROIDS/ANODISER
            'SEDATION',     # miss ASTONIED
            'DELATION',
            '',  # miss all of the AEILNOST words.
            'ASTEROID',
            'ELATERIN',  # miss ENTAILER and TREENAIL
            'DETAINER', 'RETAINED'
        ]
        # Guess all the words 3 times. (5, 5 and 1)
        for i in range(3):
            params = wwg.start_quiz(table_id, user)
            if i != 2:
                self.assertEqual(len(params['questions']), 5)
            else:
                self.assertEqual(len(params['questions']), 1)
            for w in words_to_guess:
                wwg.guess(w, table_id, user)
            wwg.give_up(user, table_id)
        return table_id, user

    def round_2(self, table_id, user):
        wwg = WordwallsGame()
        words_to_guess = [
            'AEROLITE',
            'IDOLATER', 'TAILORED',
            '',  # miss ANEROIDS again
            'ASTONIED', 'SEDATION',
            'ELATIONS', 'INSOLATE', 'TOENAILS',
            'ELATERIN', 'ENTAILER'  # miss TREENAIL
        ]
        # Guess all the words 2 times. (5, 5 and 1)
        for i in range(2):
            params = wwg.start_quiz(table_id, user)
            logger.debug('params %s', params)
            if i == 0:
                self.assertEqual(len(params['questions']), 5)
            else:
                self.assertEqual(len(params['questions']), 1)
            for w in words_to_guess:
                wwg.guess(w, table_id, user)
            wwg.give_up(user, table_id)

    def round_3(self, table_id, user):
        wwg = WordwallsGame()
        params = wwg.start_quiz(table_id, user)
        self.assertEqual(len(params['questions']), 2)
        for w in ['ANEROIDS', 'ANODISER', 'ELATERIN', 'ENTAILER', 'TREENAIL']:
            wwg.guess(w, table_id, user)

    @override_settings(WORDWALLS_QUESTIONS_PER_ROUND=5)
    def test_missed_behavior(self):
        wwg = WordwallsGame()
        table_id, user = self.round_1()
        wgm = wwg.get_wgm(table_id)
        word_list = wgm.word_list
        self.assert_wl(word_list, {
            'numAlphagrams': 11, 'numCurAlphagrams': 11,
            'numFirstMissed': 6, 'numMissed': 6, 'goneThruOnce': True,
            'questionIndex': 15, 'is_temporary': True
        })
        qs = json.loads(word_list.origQuestions)
        self.assertEqual(len(qs), 11)
        # Now start the quiz again. Should get missed words.
        self.round_2(table_id, user)
        wgm = wwg.get_wgm(table_id)
        word_list = wgm.word_list
        self.assert_wl(word_list, {
            'numAlphagrams': 11, 'numCurAlphagrams': 6,
            'numFirstMissed': 6, 'numMissed': 2, 'goneThruOnce': True,
            'questionIndex': 10, 'is_temporary': True
        })

        qs = json.loads(word_list.origQuestions)
        self.assertEqual(len(qs), 11)

        # Finally, let's solve the final two alphagrams.
        self.round_3(table_id, user)
        wgm = wwg.get_wgm(table_id)
        word_list = wgm.word_list
        self.assert_wl(word_list, {
            'numAlphagrams': 11, 'numCurAlphagrams': 2,
            'numFirstMissed': 6, 'numMissed': 0, 'goneThruOnce': True,
            'questionIndex': 5, 'is_temporary': True
        })

        # And try to start the quiz again.
        params = wwg.start_quiz(table_id, user)
        self.assertTrue('quiz is done' in params['error'])
        wgm = wwg.get_wgm(table_id)
        word_list = wgm.word_list
        self.assert_wl(word_list, {
            'numAlphagrams': 11, 'numCurAlphagrams': 0,
            'numFirstMissed': 6, 'numMissed': 0, 'goneThruOnce': True,
            'questionIndex': 0, 'is_temporary': True
        })

        # Try saving the word list.
        LIST_NAME = 'my cool lišt'
        resp = wwg.save(user, table_id, LIST_NAME)
        self.assertTrue(resp['success'])
        self.assertEqual(resp['listname'], LIST_NAME)
        wgm = wwg.get_wgm(table_id)
        word_list = wgm.word_list
        self.assert_wl(word_list, {
            'numAlphagrams': 11, 'numCurAlphagrams': 0,
            'numFirstMissed': 6, 'numMissed': 0, 'goneThruOnce': True,
            'questionIndex': 0, 'is_temporary': False, 'name': LIST_NAME
        })

    @override_settings(WORDWALLS_QUESTIONS_PER_ROUND=5)
    def test_save_before_finish(self):
        wwg = WordwallsGame()
        table_id, user = self.round_1()
        # Try saving the word list.
        LIST_NAME = 'my cooł lįšt'
        resp = wwg.save(user, table_id, LIST_NAME)
        self.assertTrue(resp['success'])
        self.assertEqual(resp['listname'], LIST_NAME)
        wgm = wwg.get_wgm(table_id)
        word_list = wgm.word_list
        self.assert_wl(word_list, {
            'numAlphagrams': 11, 'numCurAlphagrams': 11,
            'numFirstMissed': 6, 'numMissed': 6, 'goneThruOnce': True,
            'questionIndex': 15, 'is_temporary': False, 'name': LIST_NAME
        })

        qs = json.loads(word_list.origQuestions)
        self.assertEqual(len(qs), 11)
        # Now start the quiz again. Should get missed words.
        self.round_2(table_id, user)
        wgm = wwg.get_wgm(table_id)
        word_list = wgm.word_list
        self.assert_wl(word_list, {
            'numAlphagrams': 11, 'numCurAlphagrams': 6,
            'numFirstMissed': 6, 'numMissed': 2, 'goneThruOnce': True,
            'questionIndex': 10, 'is_temporary': False, 'name': LIST_NAME
        })

        qs = json.loads(word_list.origQuestions)
        self.assertEqual(len(qs), 11)

        # Finally, let's solve the final two alphagrams.
        self.round_3(table_id, user)
        wgm = wwg.get_wgm(table_id)
        word_list = wgm.word_list
        self.assert_wl(word_list, {
            'numAlphagrams': 11, 'numCurAlphagrams': 2,
            'numFirstMissed': 6, 'numMissed': 0, 'goneThruOnce': True,
            'questionIndex': 5, 'is_temporary': False, 'name': LIST_NAME
        })

        # And try to start the quiz again.
        params = wwg.start_quiz(table_id, user)
        self.assertTrue('quiz is done' in params['error'])
        wgm = wwg.get_wgm(table_id)
        word_list = wgm.word_list
        self.assert_wl(word_list, {
            'numAlphagrams': 11, 'numCurAlphagrams': 0,
            'numFirstMissed': 6, 'numMissed': 0, 'goneThruOnce': True,
            'questionIndex': 0, 'is_temporary': False, 'name': LIST_NAME
        })

    def test_cant_overwrite_list(self):
        table_id, user = self.setup_quiz(p_min=5, p_max=15, length=8)
        wwg = WordwallsGame()
        # Try saving the word list.
        LIST_NAME = 'This is my list.'
        resp = wwg.save(user, table_id, LIST_NAME)
        self.assertFalse(resp['success'])


class WordwallsSavedListModesTest(WordwallsBasicLogicTestBase):
    """
    Test modes of saved list such as missed, first missed, continue,
    restart.

    """

    def setUp(self):
        self.user = User.objects.get(username='cesar')
        self.lex = Lexicon.objects.get(lexiconName='America')
        self.wwg = WordwallsGame()

    def test_firstmissed_not_allowed(self):
        LIST_NAME = "i live in a giant bucket"
        word_list = WordList.objects.get(name=LIST_NAME)
        with self.assertRaises(GameInitException):
            self.wwg.initialize_by_saved_list(
                self.lex, self.user, word_list,
                SavedListForm.FIRST_MISSED_CHOICE,
                240)

    def test_restart_unfinished_list(self):
        LIST_NAME = "i live in a giant bucket"
        word_list = WordList.objects.get(name=LIST_NAME)
        questions = set(json.dumps(q)
                        for q in json.loads(word_list.origQuestions))
        # Try restarting the list.
        table_id = self.wwg.initialize_by_saved_list(
            self.lex, self.user, word_list, SavedListForm.RESTART_LIST_CHOICE,
            240)
        word_list = WordList.objects.get(name=LIST_NAME)
        self.assert_wl(word_list, {
            'numAlphagrams': 11, 'numCurAlphagrams': 11,
            'numFirstMissed': 0, 'numMissed': 0, 'goneThruOnce': False,
            'questionIndex': 0, 'is_temporary': False, 'name': LIST_NAME
        })
        orig_questions = set(json.dumps(q)
                             for q in json.loads(word_list.origQuestions))
        # Make sure old questions == new questions
        self.assertEqual(orig_questions, questions)
        # Start the quiz and make sure we got all 11 questions
        wwg = WordwallsGame()
        params = wwg.start_quiz(table_id, self.user)
        self.assertEqual(len(params['questions']), 11)

    @override_settings(WORDWALLS_QUESTIONS_PER_ROUND=5)
    def test_continue_unfinished_list(self):
        LIST_NAME = "i live in a giant bucket"
        word_list = WordList.objects.get(name=LIST_NAME)
        # Continue the list.
        table_id = self.wwg.initialize_by_saved_list(
            self.lex, self.user, word_list, SavedListForm.CONTINUE_LIST_CHOICE,
            240)
        word_list = WordList.objects.get(name=LIST_NAME)
        self.assert_wl(word_list, {
            'numAlphagrams': 11, 'numCurAlphagrams': 11,
            'numFirstMissed': 0, 'numMissed': 3, 'goneThruOnce': False,
            'questionIndex': 10, 'is_temporary': False, 'name': LIST_NAME
        })
        # Start the quiz; we should only get one question.
        wwg = WordwallsGame()
        params = wwg.start_quiz(table_id, self.user)
        self.assertEqual(len(params['questions']), 1)
        self.assertEqual(params['questions'][0]['a'], 'AEIORSTU')
        # Miss it.
        gave_up = wwg.give_up(self.user, table_id)
        self.assertTrue(gave_up)
        word_list = WordList.objects.get(name=LIST_NAME)
        self.assert_wl(word_list, {
            'numAlphagrams': 11, 'numCurAlphagrams': 11,
            'numFirstMissed': 4, 'numMissed': 4, 'goneThruOnce': True,
            'questionIndex': 15, 'is_temporary': False, 'name': LIST_NAME,
        })
        self.assertEqual(set([0, 2, 3, 10]),
                         set(json.loads(word_list.firstMissed)))

    def test_firstmissed_allowed(self):
        LIST_NAME = 'list the sécond'
        word_list = WordList.objects.get(name=LIST_NAME)
        table_id = self.wwg.initialize_by_saved_list(
            self.lex, self.user, word_list, SavedListForm.FIRST_MISSED_CHOICE,
            240)
        self.assertNotEqual(table_id, 0)
        wwg = WordwallsGame()
        params = wwg.start_quiz(table_id, self.user)
        self.assertEqual(len(params['questions']), 6)
        self.assertEqual(
            set([q['a'] for q in params['questions']]),
            set(['AEEILORT', 'AEEILNRT', 'ADEINOST', 'ADEINORS', 'AEILNOST',
                'ADEILORT']))

    @override_settings(WORDWALLS_QUESTIONS_PER_ROUND=5)
    def test_continue_gonethru_list(self):
        LIST_NAME = 'list the sécond'
        word_list = WordList.objects.get(name=LIST_NAME)
        table_id = self.wwg.initialize_by_saved_list(
            self.lex, self.user, word_list, SavedListForm.CONTINUE_LIST_CHOICE,
            240)
        self.assertNotEqual(table_id, 0)
        wwg = WordwallsGame()
        params = wwg.start_quiz(table_id, self.user)
        self.assertEqual(len(params['questions']), 1)
        self.assertEqual(params['questions'][0]['a'], 'ADEILORT')
        # Miss it.
        gave_up = wwg.give_up(self.user, table_id)
        self.assertTrue(gave_up)
        word_list = WordList.objects.get(name=LIST_NAME)
        self.assert_wl(word_list, {
            'numAlphagrams': 11, 'numCurAlphagrams': 6,
            'numFirstMissed': 6, 'numMissed': 1, 'goneThruOnce': True,
            'questionIndex': 10, 'is_temporary': False, 'name': LIST_NAME
        })

    def test_continue_finished_list(self):
        """ Continue a list that is tested through all the way."""
        LIST_NAME = 'This is my list.'
        word_list = WordList.objects.get(name=LIST_NAME)
        table_id = self.wwg.initialize_by_saved_list(
            self.lex, self.user, word_list, SavedListForm.CONTINUE_LIST_CHOICE,
            240)
        self.assertNotEqual(table_id, 0)
        wwg = WordwallsGame()
        params = wwg.start_quiz(table_id, self.user)
        self.assertTrue('quiz is done' in params['error'])

    def test_can_save_loaded_list(self):
        """ Can we save a list we just loaded? """
        LIST_NAME = 'list the sécond'
        num_lists_before = WordList.objects.filter(user=self.user).count()
        word_list = WordList.objects.get(name=LIST_NAME)
        table_id = self.wwg.initialize_by_saved_list(
            self.lex, self.user, word_list, SavedListForm.CONTINUE_LIST_CHOICE,
            240)
        self.assertNotEqual(table_id, 0)
        wwg = WordwallsGame()
        resp = wwg.save(self.user, table_id, LIST_NAME)
        self.assertTrue(resp['success'])
        self.assertEqual(resp['listname'], LIST_NAME)
        self.assertEqual(num_lists_before,
                         WordList.objects.filter(user=self.user).count())


def blank_bingo_generator(length, lexicon_name, num_2_blanks, num_questions,
                          max_answers):
    if length == 7:
        return [
            {'q': 'ABIPST?', 'a': ['BAPTISM', 'BAPTIST', 'BITMAPS',
             'BAPTISE']}, {'q': 'AIINTX?', 'a': ['TAXIING']},
            {'q': 'CILMSU?', 'a': ['CULTISM', 'MUSICAL']},
            {'q': 'EIOORT?', 'a': ['FOOTIER', 'HOOTIER', 'SOOTIER',
             'ZOOTIER', 'ROOTIER']},
            {'q': 'DHIIOR?', 'a': ['RHIZOID']},
            {'q': 'DIRSTW?', 'a': ['WRISTED']},
            {'q': 'EEFGSU?', 'a': ['REFUGES']},
            {'q': 'AEEIRV?', 'a': ['LEAVIER', 'VEALIER', 'HEAVIER']},
            {'q': 'AGIIOR?', 'a': ['ORIGAMI']},
            {'q': 'AEFRRY?', 'a': ['FORAYER']},
            {'q': 'AAEIOR?', 'a': ['AERADIO', 'AEROBIA']},
            {'q': 'AOOPST?', 'a': ['PATOOTS']},
            {'q': 'ILNORT?', 'a': ['NOSTRIL', 'RETINOL']},
            {'q': 'ABDIJR?', 'a': ['JAYBIRD']},
            {'q': 'AEILSU?', 'a': ['AUDILES', 'INSULAE', 'INULASE',
             'DUALISE']},
            {'q': 'ABEENR?', 'a': ['ENABLER', 'REBEGAN',
             'VERBENA', 'BEANERY']},
            {'q': 'AMNOOS?', 'a': ['MAROONS',
             'ONOMAST', 'ROMANOS']},
            {'q': 'EEKLRT?', 'a': ['KELTERS',
             'KESTREL', 'SKELTER']}, {'q': 'BNOORS?', 'a': ['BRONCOS']},
            {'q': 'AEGIIM?', 'a': ['IMAGINE']},
            {'q': 'EHILPS?',
             'a': ['HIPLESS', 'HIRPLES', 'PLENISH']},
            {'q': 'EHKNRU?',
             'a': ['HUNKIER', 'HUNKERS']},
            {'q': 'AEIMOO?', 'a': ['IPOMOEA']},
            {'q': 'EFNTT??', 'a': ['FETTING', 'FATTENS', 'FITMENT',
             'FLATTEN']},
            {'q': 'CEIUV??', 'a':
             ['CURSIVE', 'INCURVE', 'UVEITIC', 'UNVOICE', 'CURVIER']}]
    elif length == 8:
        return [
            {'q': 'AEMNOPT?', 'a': ['PTOMAINE', 'TAMPONED']},
            {'q': 'EGOORSU?', 'a': ['GORGEOUS']},
            {'q': 'EIMNOTT?', 'a': ['MONTEITH', 'OINTMENT', 'IMPOTENT']},
            {'q': 'AAMRSTU?', 'a': ['TIMARAUS', 'AMATEURS', 'TAMARAUS',
                                       'TAMBURAS']},
            {'q': 'ABINRSV?', 'a': ['VIBRANTS']},
            {'q': 'IMOOPRS?', 'a': ['IMPOROUS', 'IMPOSTOR', 'ISOMORPH',
             'PROMISOR']},
            {'q': 'EGINOSY?', 'a': ['SEIGNORY', 'HOSEYING', 'MOSEYING']},
            {'q': 'ABDORTU?', 'a': ['ABDUCTOR', 'OBDURATE', 'OUTBOARD',
             'TABOURED']},
            {'q': 'CEIIIOS?', 'a': ['IDIOCIES']},
            {'q': 'EEPRSTX?', 'a': ['EXCERPTS', 'PREEXIST', 'PRETEXTS',
             'SEXPERTS']},
            {'q': 'IILNORS?', 'a': ['LIONISER', 'LIGROINS', 'SIRLOINS']},
            {'q': 'EEGIKNS?', 'a': ['STEEKING', 'KEENINGS', 'KEEPINGS',
             'SLEEKING', 'SMEEKING']},
            {'q': 'AHKNOSW?', 'a': ['HAWKNOSE']},
            {'q': 'EEIIMRT?',
             'a': ['TIMELIER', 'EREMITIC', 'ITEMISER', 'ITEMIZER']},
            {'q': 'ACHKSSW?', 'a': ['HACKSAWS']},
            {'q': 'AEEMORT?',
             'a': ['MODERATE', 'OVERTAME']},
            {'q': 'DEOOSTV?',
             'a': ['DOVECOTS']},
            {'q': 'AMNOOPR?', 'a': ['MONOCARP', 'CRAMPOON']},
            {'q': 'EEILTUX?', 'a': ['ULEXITES']},
            {'q': 'AEIRSTX?', 'a': ['SEXTARII', 'MATRIXES']},
            {'q': 'AENORWY?', 'a': ['WEAPONRY']},
            {'q': 'AAHIRSV?', 'a': ['HAVARTIS']},
            {'q': 'DDEMNOR?', 'a': ['ENDODERM']},
            {'q': 'DEOOOW??', 'a': ['WOODLORE', 'WOODNOTE', 'WOODTONE',
             'ROSEWOOD']},
            {'q': 'ABEGIY??', 'a': ['BELAYING', 'EMBAYING', 'GIGABYTE',
             'LESBIGAY']}]


class WordwallsChallengeBehaviorTest(WordwallsBasicLogicTestBase):
    """
    Test challenge behavior. Create challenges, quiz on them, leaderboards,
    etc.

    """
    fixtures = ['test/lexica.yaml',
                'test/users.json',
                'test/profiles.json',
                'challenge_names.json',
                'test/daily_challenge.json']

    def setUp(self):
        self.user = User.objects.get(username='cesar')
        self.lex = Lexicon.objects.get(lexiconName='America')
        self.wwg = WordwallsGame()

    def test_length_challenge(self):
        """ Test a regular challenge by word length (Today's 6s). """
        num_challenges = DailyChallenge.objects.count()
        challenge = DailyChallengeName.objects.get(name="Today's 6s")
        table_id = self.wwg.initialize_daily_challenge(
            self.user, self.lex, challenge,
            timezone.localtime(timezone.now()).date())
        # Assert that it created a challenge.
        self.assertEqual(num_challenges + 1, DailyChallenge.objects.count())
        wgm = self.wwg.get_wgm(table_id)
        state = json.loads(wgm.currentGameState)
        self.assertTrue(state['qualifyForAward'])
        word_list = wgm.word_list
        self.assert_wl(word_list, {
            'numAlphagrams': 50, 'numCurAlphagrams': 50,
            'numFirstMissed': 0, 'numMissed': 0, 'goneThruOnce': False,
            'questionIndex': 0, 'is_temporary': True
        })
        questions = json.loads(word_list.origQuestions)
        for q in questions:
            self.assertEqual(len(q['q']), 6, msg=q)
        self.assertEqual(
            len(set([q['q'] for q in questions])), 50)

    def test_bingo_marathon_challenge(self):
        """ Test bingo marathon challenge. """
        challenge = DailyChallengeName.objects.get(name='Bingo Marathon')
        table_id = self.wwg.initialize_daily_challenge(
            self.user, self.lex, challenge,
            timezone.localtime(timezone.now()).date())
        wgm = self.wwg.get_wgm(table_id)
        state = json.loads(wgm.currentGameState)
        self.assertTrue(state['qualifyForAward'])
        word_list = wgm.word_list
        self.assert_wl(word_list, {
            'numAlphagrams': 100, 'numCurAlphagrams': 100,
            'numFirstMissed': 0, 'numMissed': 0, 'goneThruOnce': False,
            'questionIndex': 0, 'is_temporary': True
        })
        questions = json.loads(word_list.origQuestions)
        # Check there are 50 7s and 50 8s
        num_7s = 0
        num_8s = 0
        for q in questions:
            if len(q['q']) == 7:
                num_7s += 1
            elif len(q['q']) == 8:
                num_8s += 1
        self.assertEqual(num_7s, 50)
        self.assertEqual(num_8s, 50)
        self.assertEqual(
            len(set([q['q'] for q in questions])), 100)
        params = self.wwg.start_quiz(table_id, self.user)
        self.assertEqual(len(params['questions']), 100)
        probability = params['questions'][0]['p']
        self.assertTrue(probability > 0)

    @mock.patch('wordwalls.challenges.gen_blank_challenges',
                side_effect=blank_bingo_generator)
    def test_blank_bingos(self, mock_content):
        """ Test blank bingos. (This comment is unnecessary, right?)"""
        challenge = DailyChallengeName.objects.get(name='Blank Bingos')
        table_id = self.wwg.initialize_daily_challenge(
            self.user, self.lex, challenge,
            timezone.localtime(timezone.now()).date())
        wgm = self.wwg.get_wgm(table_id)
        state = json.loads(wgm.currentGameState)
        self.assertTrue(state['qualifyForAward'])
        word_list = wgm.word_list
        self.assert_wl(word_list, {
            'numAlphagrams': 50, 'numCurAlphagrams': 50,
            'numFirstMissed': 0, 'numMissed': 0, 'goneThruOnce': False,
            'questionIndex': 0, 'is_temporary': True
        })
        questions = json.loads(word_list.origQuestions)
        self.assertEqual(
            len(set([q['q'] for q in questions])), 50)
        params = self.wwg.start_quiz(table_id, self.user)
        self.assertEqual(len(params['questions']), 50)
        # Blank bingos have no probability for their alphagram.
        self.assertTrue(params['questions'][0]['p'] is None)

    def test_play_old_challenge(self):
        """ Play an old challenge instead of creating a new one. """
        num_challenges = DailyChallenge.objects.count()
        challenge = DailyChallengeName.objects.get(name="Bingo Marathon")
        table_id = self.wwg.initialize_daily_challenge(
            self.user, Lexicon.objects.get(lexiconName='CSW15'),
            challenge, date(2015, 12, 8))
        # Assert that it did not create an additional challenge.
        self.assertEqual(num_challenges, DailyChallenge.objects.count())
        wgm = self.wwg.get_wgm(table_id)
        state = json.loads(wgm.currentGameState)
        self.assertFalse(state['qualifyForAward'])
        word_list = wgm.word_list
        self.assert_wl(word_list, {
            'numAlphagrams': 100, 'numCurAlphagrams': 100,
            'numFirstMissed': 0, 'numMissed': 0, 'goneThruOnce': False,
            'questionIndex': 0, 'is_temporary': True
        })
        questions = json.loads(word_list.origQuestions)
        for q in questions:
            self.assertTrue(len(q['q']) in (7, 8), msg=q)
        self.assertEqual(
            len(set([q['q'] for q in questions])), 100)
        params = self.wwg.start_quiz(table_id, self.user)
        self.assertEqual(len(params['questions']), 100)

    def test_play_old_blank_bingos(self):
        """
        Play an old blank bingos challenge instead of creating a new one.

        """
        num_challenges = DailyChallenge.objects.count()
        challenge = DailyChallengeName.objects.get(name="Blank Bingos")
        table_id = self.wwg.initialize_daily_challenge(
            self.user, Lexicon.objects.get(lexiconName='America'),
            challenge, date(2016, 1, 1))
        # Assert that it did not create an additional challenge.
        self.assertEqual(num_challenges, DailyChallenge.objects.count())
        wgm = self.wwg.get_wgm(table_id)
        state = json.loads(wgm.currentGameState)
        self.assertFalse(state['qualifyForAward'])
        word_list = wgm.word_list
        self.assert_wl(word_list, {
            'numAlphagrams': 50, 'numCurAlphagrams': 50,
            'numFirstMissed': 0, 'numMissed': 0, 'goneThruOnce': False,
            'questionIndex': 0, 'is_temporary': True
        })
        questions = json.loads(word_list.origQuestions)
        for q in questions:
            self.assertTrue(len(q['q']) in (7, 8), msg=q)
        self.assertEqual(
            len(set([q['q'] for q in questions])), 50)
        params = self.wwg.start_quiz(table_id, self.user)
        self.assertEqual(len(params['questions']), 50)


class WordwallsMissedBingosTest(WordwallsBasicLogicTestBase):
    """
    Missed bingos.

    We have one basic case here. It is easiest to test given a good text
    editor; we can search for "board": {some integer} in the leaderboard
    entry json, for example, to quickly find the total number of people
    who did that challenge, etc.

    The answers below are a little bit off from the count, because
    we throw away leaderboard entries where "qualifyForAward" is false.

    For this case, we got Monday, Tuesday, Wednesday, Thursday. We throw
    away the first two (Monday 7s and 8s) since the "missed bingo"
    challenge week starts on Tuesday.

    challenge 40256, leaderboard 40079, answers: 54   Tues  7s
    challenge 40260, leaderboard 40082, answers: 34   Tues  8s
    challenge 40279, leaderboard 40106, answers: 47   Wed   7s
    challenge 40287, leaderboard 40108, answers: 34   Wed   8s
    challenge 40307, leaderboard 40128, answers: 58   Thurs 7s
    challenge 40313, leaderboard 40134, answers: 33   Thurs 8s

    """
    fixtures = ['test/lexica.yaml',
                # Eventually get rid of these two, because they are
                # replaced by sqlite, but for now we test for backwards
                # compatibility, since we are doing an in-place
                # migration.
                'test/users.json',
                'test/profiles.json',
                'challenge_names.json',
                'test/daily_challenge.json',
                'test/daily_challenge_leaderboard.json',
                'test/daily_challenge_leaderboard_entry.json',
                'test/daily_challenge_missed_bingos.json']

    expected_missed_bingos = set([
        'ADEEIKKS', 'DEIILMMS', 'ACIORRTT', 'ACELOPRT', 'AFIIMNPR',
        'ALMOOPRS', 'AACEOSST', 'BDEEILNR', 'HIMORSST', 'EHOORSST',
        'AGHNORST', 'ACCILRSY', 'ACCDEILY', 'ACIIRSTT', 'DEHKLNOU',
        'AADGMNOP', 'AEORRRST', 'CIILNOPS', 'AAGIMNOS', 'ADILMOSY',
        'ADEIMSTY', 'DEELLORW', 'EGIILNRS', 'AACEEHRT', 'EEILNOSV',

        'AABLLOR', 'FIOPRST', 'AEHIMSS', 'ACCDHIL', 'ACEHRRX',
        'CEHNOSU', 'ACHHIRS', 'AEGILNR', 'EIMORST', 'EGMORSU',
        'ACCEIST', 'AELMMSY', 'EEINSTV', 'LLOSTUY', 'ACEIRTT',
        'AAAKLMY', 'BIMNOSU', 'AALOPRS', 'CIKNPSY', 'BDNOORU',
        'AEHMPTY', 'ACCILST', 'AEGIKPR', 'ENNORSU', 'ACIRTUY'
    ])

    def setUp(self):
        self.user = User.objects.get(username='cesar')
        self.lex = Lexicon.objects.get(lexiconName='America')
        self.wwg = WordwallsGame()

    def test_load_missed_bingos(self):
        challenge = DailyChallengeName.objects.get(
            name="Week's Bingo Toughies")
        table_id = self.wwg.initialize_daily_challenge(
            self.user, self.lex, challenge, date(2015, 10, 20))
        wgm = self.wwg.get_wgm(table_id)
        state = json.loads(wgm.currentGameState)
        # This test is run more than a week afterwards, for all time,
        # so it does not qualify for an award anymore. We should maybe
        # mock time to make it clear it's at least a week after 2015/10/19
        self.assertFalse(state['qualifyForAward'])
        word_list = wgm.word_list
        self.assert_wl(word_list, {
            'numAlphagrams': 50, 'numCurAlphagrams': 50,
            'numFirstMissed': 0, 'numMissed': 0, 'goneThruOnce': False,
            'questionIndex': 0, 'is_temporary': True
        })
        questions = json.loads(word_list.origQuestions)
        # logger.debug('Questions: %s', questions)
        self.assertEqual(set([q['q'] for q in questions]),
                         self.expected_missed_bingos)


class WordwallsNamedListTest(TestCase, WordListAssertMixin):
    """ "Named" lists. """
    fixtures = ['test/lexica.yaml',
                'test/users.json',
                'test/profiles.json',
                'test/word_lists.json',
                'test/named_lists.json']

    def setUp(self):
        self.user = User.objects.get(username='cesar')
        self.lex = Lexicon.objects.get(lexiconName='America')
        self.wwg = WordwallsGame()

    def test_range_list_short(self):
        table_id = self.wwg.initialize_by_named_list(
            self.lex, self.user, NamedList.objects.get(pk=3143), 240)
        self.assertNotEqual(table_id, 0)
        wgm = self.wwg.get_wgm(table_id)
        word_list = wgm.word_list
        self.assert_wl(word_list, {
            'numAlphagrams': 1000, 'numCurAlphagrams': 1000,
            'numFirstMissed': 0, 'numMissed': 0, 'goneThruOnce': False,
            'questionIndex': 0, 'is_temporary': True
        })
        orig_questions = set(json.dumps(q)
                             for q in json.loads(word_list.origQuestions))
        self.assertEqual(len(orig_questions), 1000)
        # Start the quiz.
        wwg = WordwallsGame()
        params = wwg.start_quiz(table_id, self.user)
        self.assertEqual(len(params['questions']), 50)

    def test_range_list_long(self):
        table_id = self.wwg.initialize_by_named_list(
            self.lex, self.user, NamedList.objects.get(pk=3099), 240)
        self.assertNotEqual(table_id, 0)
        wgm = self.wwg.get_wgm(table_id)
        word_list = wgm.word_list
        self.assert_wl(word_list, {
            'numAlphagrams': 21063, 'numCurAlphagrams': 21063,
            'numFirstMissed': 0, 'numMissed': 0, 'goneThruOnce': False,
            'questionIndex': 0, 'is_temporary': True
        })
        orig_questions = set(json.dumps(q)
                             for q in json.loads(word_list.origQuestions))
        self.assertEqual(len(orig_questions), 21063)
        # Start the quiz.
        wwg = WordwallsGame()
        params = wwg.start_quiz(table_id, self.user)
        self.assertEqual(len(params['questions']), 50)

    def test_individual_alphas(self):
        table_id = self.wwg.initialize_by_named_list(
            self.lex, self.user, NamedList.objects.get(pk=3092), 240)
        self.assertNotEqual(table_id, 0)
        wgm = self.wwg.get_wgm(table_id)
        word_list = wgm.word_list
        self.assert_wl(word_list, {
            'numAlphagrams': 691, 'numCurAlphagrams': 691,
            'numFirstMissed': 0, 'numMissed': 0, 'goneThruOnce': False,
            'questionIndex': 0, 'is_temporary': True
        })
        orig_questions = set(json.dumps(q)
                             for q in json.loads(word_list.origQuestions))
        self.assertEqual(len(orig_questions), 691)
        # Start the quiz.
        wwg = WordwallsGame()
        params = wwg.start_quiz(table_id, self.user)
        self.assertEqual(len(params['questions']), 50)
        logger.debug(params['questions'])
        self.assertNotEqual(re.search(r'[JQXZ]', params['questions'][0]['a']),
                            None)
