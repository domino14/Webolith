"""
A class mostly to test the logic for wordwalls/game.py

"""

from django.test import TestCase
from wordwalls.game import WordwallsGame, SearchDescription
from django.test.client import Client
from base.models import Lexicon, alphProbToProbPK
from django.contrib.auth.models import User
import mock
import json


class WordwallsGameLogicTest(TestCase):
    fixtures = ['test/lexica.json', 'test/alphagrams.json', 'test/words.json',
                'test/users.json']

    def setUp(self):
        self.client = Client()

    def setup_quiz(self):
        """
        A helper function to start a quiz.
        """
        wwg = WordwallsGame()
        user = User.objects.get(username='cesar')
        lex = Lexicon.objects.get(lexiconName='America')
        min_pk = alphProbToProbPK(10, lex.pk, 8)
        max_pk = alphProbToProbPK(90, lex.pk, 8)
        search = SearchDescription.probPkIndexRange(min_pk, max_pk, lex)
        table_id = wwg.initializeBySearchParams(user, search, 240)
        should_start = wwg.startRequest(user, table_id)
        self.assertTrue(should_start)
        return table_id, user

    def test_quiz_params_correct(self):
        table_id, user = self.setup_quiz()
        wwg = WordwallsGame()
        params = wwg.startQuiz(table_id, user)
        self.assertEqual(len(params['questions']), 50)
        self.assertEqual(params['time'], 240)
        self.assertEqual(params['gameType'], 'regular')
        self.assertEqual(params['serverMsg'],
                         'These are questions 1 through 50 of 81.')
        going, last_correct = wwg.guess('CATS', table_id, user)
        self.assertTrue(going)
        self.assertEqual(last_correct, '')

    @mock.patch.object(WordwallsGame, 'didTimerRunOut')
    def test_quiz_ends_after_time(self, timer_ran_out):
        # Mock timer running out by the time the guess comes in.
        timer_ran_out.return_value = True
        table_id, user = self.setup_quiz()
        wwg = WordwallsGame()
        wwg.startQuiz(table_id, user)
        going, last_correct = wwg.guess('CATS', table_id, user)
        self.assertFalse(going)
        self.assertEqual(last_correct, '')
        wgm = wwg.getWGM(table_id)
        state = json.loads(wgm.currentGameState)
        self.assertFalse(state['quizGoing'])
