import logging
import threading
from contextlib import closing

from django.test import TransactionTestCase
from django.db import connection, transaction

from lib.word_searches import SearchDescription
from base.models import Lexicon, WordList, User
from wordwalls.game import WordwallsGame
logger = logging.getLogger(__name__)


class WordwallsConcurrentSolveTest(TransactionTestCase):
    fixtures = ['test/lexica.json',
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
        search = SearchDescription.probability_range(p_min, p_max, length, lex)
        logger.debug('In setup_quiz, word lists: %s', WordList.objects.all())
        table_id = wwg.initialize_by_search_params(user, search, 240)
        return table_id, user

    def test_guess_same_word(self):
        table_id, user = self.setup_quiz(p_min=5, p_max=15, length=8)
        wwg = WordwallsGame()
        with transaction.atomic():
            wwg.start_quiz(table_id, user)

        def guess_fn(w, user):
            with closing(connection):
                with transaction.atomic():
                    wwg.guess(w, table_id, user, sleep=1)

        user_1 = User.objects.get(username='user_4738')
        user_2 = User.objects.get(username='user_131')
        threads = []
        word = 'ELATIONS'
        threads.append(threading.Thread(target=guess_fn,
                                        args=(word, user)))
        threads.append(threading.Thread(target=guess_fn,
                                        args=(word, user_1)))
        threads.append(threading.Thread(target=guess_fn,
                                        args=(word, user_2)))
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        st = wwg.state(table_id)
        self.assertFalse(word in st['answerHash'])
        self.assertTrue(word in st['originalAnswerHash'])
        self.assertTrue(word in st['solvers'])
        self.assertTrue(
            st['solvers'][word] in ['cesar', 'user_4738', 'user_131'])

    def test_guess_same_alphagram(self):
        table_id, user = self.setup_quiz(p_min=5, p_max=15, length=8)
        wwg = WordwallsGame()
        with transaction.atomic():
            wwg.start_quiz(table_id, user)

        def guess_fn(w, user):
            with closing(connection):
                with transaction.atomic():
                    wwg.guess(w, table_id, user, sleep=1)

        user_1 = User.objects.get(username='user_4738')
        user_2 = User.objects.get(username='user_131')
        threads = []
        word = 'ELATIONS'
        threads.append(threading.Thread(target=guess_fn,
                                        args=('ELATIONS', user)))
        threads.append(threading.Thread(target=guess_fn,
                                        args=('INSOLATE', user_1)))
        threads.append(threading.Thread(target=guess_fn,
                                        args=('TOENAILS', user_2)))
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        st = wwg.state(table_id)
        self.assertFalse('ELATIONS' in st['answerHash'])
        self.assertFalse('INSOLATE' in st['answerHash'])
        self.assertFalse('TOENAILS' in st['answerHash'])
        self.assertTrue('ELATIONS' in st['solvers'])
        self.assertTrue('INSOLATE' in st['solvers'])
        self.assertTrue('TOENAILS' in st['solvers'])
        for word in 'ELATIONS', 'INSOLATE', 'TOENAILS':
            self.assertTrue(
                st['solvers'][word] in ['cesar', 'user_4738', 'user_131'])
