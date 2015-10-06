# -*- coding: utf-8 -*-

"""
A class mostly to test the logic for wordwalls/game.py

"""

from django.test import TestCase
from wordwalls.game import WordwallsGame
from lib.word_searches import SearchDescription
from base.models import Lexicon
from django.contrib.auth.models import User
import mock
import json
from django.test.utils import override_settings
import logging
logger = logging.getLogger(__name__)


class WordwallsBasicLogicTest(TestCase):
    fixtures = ['test/lexica.json',
                # These are replaced by the sqlite databases but we
                # might need them to test backwards compatibility.
                # 'test/alphagrams.json',
                # 'test/words.json',
                'test/users.json',
                'test/profiles.json']

    def setup_quiz(self, p_min=10, p_max=90, length=8):
        """
        A helper function to start a quiz.
        """
        wwg = WordwallsGame()
        user = User.objects.get(username='cesar')
        lex = Lexicon.objects.get(lexiconName='America')
        search = SearchDescription.probability_range(p_min, p_max, length, lex)
        table_id = wwg.initialize_by_search_params(user, search, 240)
        return table_id, user

    def assert_wl(self, word_list, params):
        """
        Assert that the word list params are as stated.
        params - an object that looks like {'numAlphagrams': 11, ...}
        """
        for param, value in params.iteritems():
            self.assertEqual(
                getattr(word_list, param), value,
                msg='Not equal: %s (%s, %s != %s)' % (
                    word_list,
                    param,
                    repr(value),
                    repr(getattr(word_list, param))))

    def test_quiz_params_correct(self):
        table_id, user = self.setup_quiz()
        wwg = WordwallsGame()
        params = wwg.start_quiz(table_id, user)
        self.assertEqual(len(params['questions']), 50)
        self.assertEqual(params['time'], 240)
        self.assertEqual(params['gameType'], 'regular')
        self.assertEqual(params['serverMsg'],
                         'These are questions 1 through 50 of 81.')
        going, last_correct = wwg.guess('CATS', table_id, user)
        self.assertTrue(going)
        self.assertEqual(last_correct, '')

    @mock.patch.object(WordwallsGame, 'did_timer_run_out')
    def test_quiz_ends_after_time(self, timer_ran_out):
        # Mock timer running out by the time the guess comes in.
        timer_ran_out.return_value = True
        table_id, user = self.setup_quiz()
        wwg = WordwallsGame()
        wwg.start_quiz(table_id, user)
        going, last_correct = wwg.guess('CATS', table_id, user)
        self.assertFalse(going)
        self.assertEqual(last_correct, '')
        wgm = wwg.get_wgm(table_id)
        state = json.loads(wgm.currentGameState)
        self.assertFalse(state['quizGoing'])

    def test_word_list_created(self):
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


class WordwallsFullGameLogicTest(WordwallsBasicLogicTest):
    """
    Testing full games, make sure word lists save, missed plays, etc.

    """
    def start_quiz(self):
        table_id, user = self.setup_quiz()
        wwg = WordwallsGame()
        return wwg.start_quiz(table_id, user), table_id, user, wwg

    def test_solve_all_words(self):
        """
        Test on a word list with more than 50 words. Go to completion,
        ensure quiz on missed, etc.

        """
        params, table_id, user, wwg = self.start_quiz()

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
                going, last_correct = wwg.guess(w, table_id, user)
                if idx != ct:
                    self.assertTrue(going)
                else:
                    self.assertFalse(going)      # Quiz ends
                self.assertTrue(last_correct != '')

        fully_solve_and_assert()
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

    @override_settings(WORDWALLS_QUESTIONS_PER_ROUND=5)
    def test_missed_behavior(self):
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
        params = wwg.start_quiz(table_id, user)
        self.assertEqual(len(params['questions']), 2)
        for w in ['ANEROIDS', 'ANODISER', 'ELATERIN', 'ENTAILER', 'TREENAIL']:
            wwg.guess(w, table_id, user)

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
        LIST_NAME = 'my cool lišt'.decode('utf8')
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


class WordwallsSavedListModesTest(TestCase):
    """
    Test modes of saved list such as missed, first missed, continue,
    restart.

    """


class WordwallsChallengeBehaviorTest(TestCase):
    """
    Test challenge behavior. Create challenges, quiz on them, leaderboards,
    etc.

    """


class WordwallsMissedBingosTest(TestCase):
    """
    Missed bingos.

    """


class WordwallsMigrationTest(TestCase):
    """
    Make sure we can migrate old lists to new lists, or similar.

    """
