# -*- coding: utf-8 -*-

"""
A class mostly to test the logic for wordwalls/game.py

"""

from django.test import TestCase
from base.forms import SavedListForm
from datetime import date
from wordwalls.game import WordwallsGame
from wordwalls.models import DailyChallengeName, NamedList
from wordwalls.tests.mixins import WordListAssertMixin
from lib.word_searches import SearchDescription
from base.models import Lexicon, WordList
from django.contrib.auth.models import User
import mock
import re
import json
from django.test.utils import override_settings
import logging
logger = logging.getLogger(__name__)


class WordwallsBasicLogicTest(TestCase, WordListAssertMixin):
    fixtures = ['test/lexica.json',
                'test/users.json',
                'test/profiles.json',
                'test/word_lists.json']

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
        LIST_NAME = u'my cool lišt'
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
        LIST_NAME = u'my cooł lįšt'
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
        LIST_NAME = u'This is my list.'
        resp = wwg.save(user, table_id, LIST_NAME)
        self.assertFalse(resp['success'])


class WordwallsSavedListModesTest(WordwallsBasicLogicTest):
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
        table_id = self.wwg.initialize_by_saved_list(
            self.lex, self.user, word_list, SavedListForm.FIRST_MISSED_CHOICE,
            240)
        self.assertEqual(table_id, 0)

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
        LIST_NAME = u'list the sécond'
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
        LIST_NAME = u'list the sécond'
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
        LIST_NAME = u'This is my list.'
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
        LIST_NAME = u'list the sécond'
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


def blank_bingo_loader(challenge_date, length, lexicon_name):
    if length == 7:
        return """
RLAKEA? KRAALED
RDNRGE? GRANDER GRINDER GNARRED REGRIND
WATEED? DEWATER TARWEED SWEATED WATERED TWEAKED
TESFEA? FEATEST FEASTED DEFEATS DEAFEST FEASTER AFREETS
INISDC? INDICTS INCISED INDICES DISCING
DIFTEU? FRUITED FEUDIST
CGPPAI? CAPPING
DSIOGE? GOODIES DINGOES DOGGIES
ELPOFR? PROFILE FLOPPER
ALOLIC? LOGICAL LOCHIAL
BDTEAA? DATABLE ABLATED
NFTAEN? INFANTE
RRIILE? ROILIER GIRLIER
GAREGE? ENGAGER RAGGEES REGAUGE REGGAES
ISTOMI? MIOTICS MITOSIS SOMITIC
ERGYOA? VOYAGER ORANGEY
IORLAB? BIPOLAR LABROID GARBOIL PARBOIL ORBITAL KILOBAR BOLIVAR BAILORS
ATHDRS? HARDSET HARDEST TRASHED DEARTHS HATREDS THREADS
LAISOI? LIAISON SIALOID
AOPTHE? POTHEAD TEASHOP PHONATE PHAETON TAPHOLE PHORATE APOTHEM
ETTANL? TETANAL TALENTS LATENTS GANTLET FLATTEN LATTENS MANTLET
AROEIR? ARMOIRE HOARIER
ADSLYI? DISPLAY SHADILY STAIDLY LADYISH DIALYSE
ARHIV?? HAVARTI HRYVNIA HAVIOUR ARCHIVE VARNISH CHIVARI HAVIORS HEAVIER
ODYOU?? DUOPOLY
        """
    elif length == 8:
        return """
AEOTZIL? THIAZOLE TOTALIZE TRIAZOLE
ORSNENI? INFERNOS IRONNESS ENVIRONS REUNIONS RAISONNE INTONERS EINKORNS NEGRONIS NONSKIER TERNIONS
GDINAOZ? AGONIZED
ETAOGIN? NEGATION LEGATION GELATION
AAITLDT? DILATANT DILATATE
MIAELHI? LITHEMIA HEMIOLIA
DTITNRA? DRATTING NITRATED
CNVSINE? CONNIVES
MAEETER? EMEERATE METERAGE PERMEATE RETEAMED AMEERATE EMERITAE METAMERE
NORAOTL? ORTOLANS COLORANT
LAAMNDS? LADANUMS LANDMASS MANDALAS DALESMAN LANDSMAN MANDOLAS LEADSMAN
RLSLAOZ? ZORILLAS
GEISNIN? INDIGENS INBEINGS SINGEING ENISLING SKEINING ENSILING VEININGS RESINING SINEWING GINNIEST
SHDIAPO? HAPLOIDS SHIPLOAD SCAPHOID HAPKIDOS
NEESOFT? FELSTONE SOFTENED RESOFTEN SOFTENER OFTENEST
TIAISAC? SCIATICA ACTINIAS
ICTIRAS? SCIMITAR ARTISTIC TRIACIDS TRIBASIC TRIADICS TRIASSIC CARDITIS RACHITIS AORISTIC
ATOERPN? PROTEANS COPARENT ATROPINE PRONATED PORTANCE OPERANTS PRONATES PATENTOR
ONETSEX? EXTENSOR
NABORGT? BORATING TABORING ABORTING
DWSCBRI? COWBIRDS BAWDRICS
DTKEEOP? POCKETED
EORNADE? OLEANDER ENDEAVOR ENAMORED RELOANED RENEGADO DEMEANOR REASONED AERODYNE
EUAEQT?? BEQUEATH EQUISETA MAQUETTE COEQUATE ADEQUATE
RBRHIO?? HORRIBLY HORRIBLE BIRROTCH
        """


class WordwallsChallengeBehaviorTest(WordwallsBasicLogicTest):
    """
    Test challenge behavior. Create challenges, quiz on them, leaderboards,
    etc.

    """
    fixtures = ['test/lexica.json',
                'test/users.json',
                'test/profiles.json',
                'dcNames.json']

    def setUp(self):
        self.user = User.objects.get(username='cesar')
        self.lex = Lexicon.objects.get(lexiconName='OWL2')
        self.wwg = WordwallsGame()

    def test_length_challenge(self):
        """ Test a regular challenge by word length (Today's 6s). """
        challenge = DailyChallengeName.objects.get(name="Today's 6s")
        table_id = self.wwg.initialize_daily_challenge(
            self.user, self.lex, challenge, date.today())
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
            self.user, self.lex, challenge, date.today())
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

    @mock.patch('wordwalls.challenges.get_blank_bingos_content',
                side_effect=blank_bingo_loader)
    def test_blank_bingos(self, mock_content):
        """ Test blank bingos. (This comment is unnecessary, right?)"""
        challenge = DailyChallengeName.objects.get(name='Blank Bingos')
        table_id = self.wwg.initialize_daily_challenge(
            self.user, self.lex, challenge, date.today())
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
        logger.debug('Questions: %s', questions)
        self.assertEqual(
            len(set([q['q'] for q in questions])), 50)

    def test_toughies(self):
        """ Test the toughies / missed bingo challenge generator. """


class WordwallsMissedBingosTest(WordwallsBasicLogicTest):
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
    fixtures = ['test/lexica.json',
                # Eventually get rid of these two, because they are
                # replaced by sqlite, but for now we test for backwards
                # compatibility, since we are doing an in-place
                # migration.
                'test/alphagrams.json',
                'test/words.json',
                'test/users.json',
                'test/profiles.json',
                'dcNames.json',
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


class WordwallsMigrationTest(TestCase):
    """
    Make sure we can migrate old lists to new lists, or similar.
    XXX: These tests are obsolete, rewrite or kill.
    """
    # fixtures = ['test/lexica.json',
    #             # These are replaced by the sqlite databases but we
    #             # need them here to test backwards compatibility.
    #             'test/alphagrams.json',
    #             'test/words.json',
    #             'test/users.json',
    #             'test/profiles.json',
    #             'test/word_lists.json',
    #             'test/wordwallsgamemodel.json']

    # def test_migrate_ongoing_game_no_save(self):
    #     """
    #     Migrate an on-going game that has no saved list attached to it.

    #     """
    #     wwg = WordwallsGame()
    #     table_id = 633827
    #     user = User.objects.get(username='cesar')
    #     lexicon = Lexicon.objects.get(lexiconName='America')
    #     params = wwg.start_quiz(table_id, user)
    #     self.assertEqual(len(params['questions']), 15)
    #     wgm = wwg.get_wgm(table_id)
    #     self.assertEqual(wgm.word_list.lexicon, lexicon)
    #     self.assertEqual(wgm.word_list.questionIndex, 50)
    #     self.assertEqual(wgm.word_list.numCurAlphagrams, 15)
    #     self.assertTrue(wgm.word_list.is_temporary)
    #     self.assertEqual(len(wgm.word_list.name), 32)
    #     self.assertTrue(wgm.word_list.goneThruOnce)
    #     self.assertEqual(wgm.word_list.version, 1)

    # def test_migrate_ongoing_game_saved(self):
    #     """
    #     Migrate an on-going game with a saved list attached to it.

    #     """
    #     wwg = WordwallsGame()
    #     table_id = 633828
    #     user = User.objects.get(username='cesar')
    #     lexicon = Lexicon.objects.get(lexiconName='America')
    #     params = wwg.start_quiz(table_id, user)
    #     self.assertEqual(len(params['questions']), 2)
    #     wgm = wwg.get_wgm(table_id)
    #     self.assertEqual(wgm.word_list.lexicon, lexicon)
    #     self.assertEqual(wgm.word_list.questionIndex, 100)
    #     self.assertEqual(wgm.word_list.numCurAlphagrams, 52)
    #     self.assertFalse(wgm.word_list.is_temporary)
    #     self.assertEqual(wgm.word_list.name, '8s_2_53')
    #     self.assertEqual(wgm.word_list.numAlphagrams, 52)
    #     self.assertFalse(wgm.word_list.goneThruOnce)
    #     self.assertEqual(wgm.word_list.version, 1)

    # def test_migrate_wordlist_version_inplace(self):
    #     """
    #     This is kind of similar to the above, maybe rewrite. We need
    #     a migration function to migrate word lists en masse.

    #     """
    #     pass


class WordwallsNamedListTest(TestCase, WordListAssertMixin):
    """ "Named" lists. """
    fixtures = ['test/lexica.json',
                'test/users.json',
                'test/profiles.json',
                'test/word_lists.json',
                'test/wordwallsgamemodel.json',
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
