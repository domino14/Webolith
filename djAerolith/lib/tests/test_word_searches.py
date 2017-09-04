import logging
import time
from django.test import TestCase

from base.models import Lexicon, User, AlphagramTag
from lib.word_searches import word_search, SearchDescription
from lib.word_db_helper import Alphagram, Word, Question
logger = logging.getLogger(__name__)


class SimpleSearchCase(TestCase):
    fixtures = [
        'test/lexica.json'
    ]

    def setUp(self):
        self.america = Lexicon.objects.get(lexiconName='America')

    def test_probability_word_search(self):
        sd = SearchDescription.probability_range(200, 203, 8, self.america)
        qs = word_search([sd])

        self.assertEqual(qs.size(), 4)

        self.assertEqual(
            set(['ADEEGNOR', 'EEGILNOR', 'ADEEGORT', 'AEEGLNOT']),
            qs.alphagram_string_set())
        self.assertTrue(len(qs.questions_array()[0].answers[0].definition) > 0)

    def test_probability_and_points(self):
        sd = SearchDescription.probability_range(3000, 3010, 8, self.america)
        sdp = SearchDescription.points(8, self.america, 14, 30)
        qs = word_search([sd, sdp])

        self.assertEqual(qs.size(), 4)
        self.assertEqual(
            set(['EHILORTY', 'DEHIOPRT', 'DEINORVW', 'CDEINORV']),
            qs.alphagram_string_set())
        self.assertTrue(len(qs.questions_array()[0].answers[0].definition) > 0)

    def test_probability_points_problimit(self):
        sd = SearchDescription.probability_range(3000, 3010, 8, self.america)
        sdp = SearchDescription.points(8, self.america, 14, 30)
        sdl = SearchDescription.limit_probability(8, self.america, 1, 3)
        qs = word_search([sd, sdp, sdl])

        self.assertEqual(qs.size(), 3)
        self.assertEqual(
            ['EHILORTY', 'DEHIOPRT', 'DEINORVW'],
            qs.alphagram_string_list())
        self.assertTrue(len(qs.questions_array()[0].answers[0].definition) > 0)

    def test_points(self):
        sdp = SearchDescription.points(7, self.america, 40, 100)
        qs = word_search([sdp])
        self.assertEqual(qs.size(), 2)
        self.assertEqual(
            set(['AIPZZZZ', 'AVYYZZZ']),
            qs.alphagram_string_set())
        self.assertTrue(len(qs.questions_array()[0].answers[0].definition) > 0)

    def test_num_anagrams(self):
        sdp = SearchDescription.number_anagrams(7, self.america, 8, 100)
        qs = word_search([sdp])
        self.assertEqual(qs.size(), 5)
        self.assertEqual(
            set(['AEINRST', 'EIPRSST', 'EORSSTU', 'AEGINST', 'AEGINRS']),
            qs.alphagram_string_set())
        self.assertTrue(len(qs.questions_array()[0].answers[0].definition) > 0)

    def test_pts_num_anagrams(self):
        sdp = SearchDescription.number_anagrams(7, self.america, 8, 100)
        sdp2 = SearchDescription.points(7, self.america, 8, 100)
        qs = word_search([sdp, sdp2])
        self.assertEqual(qs.size(), 3)
        self.assertEqual(
            set(['EIPRSST', 'AEGINST', 'AEGINRS']),
            qs.alphagram_string_set())
        self.assertTrue(len(qs.questions_array()[0].answers[0].definition) > 0)


class TagSearchCase(TestCase):
    fixtures = [
        'test/lexica.json',
        'test/users.json',
        'test/profiles.json'
    ]

    def create_some_tags(self):
        america = Lexicon.objects.get(lexiconName='America')
        self.america = america
        csw15 = Lexicon.objects.get(lexiconName='CSW15')
        self.csw15 = csw15
        cesar = User.objects.get(username='cesar')
        self.cesar = cesar
        user4113 = User.objects.get(username='user_4113')
        # Create a few tags.
        AlphagramTag.objects.create(user=cesar, lexicon=csw15, tag='D4',
                                    alphagram='AELMOSTU')
        AlphagramTag.objects.create(user=user4113, lexicon=america, tag='D3',
                                    alphagram='DEHIOPRT')
        AlphagramTag.objects.create(user=cesar, lexicon=america, tag='D5',
                                    alphagram='AEILT')
        AlphagramTag.objects.create(user=cesar, lexicon=america, tag='D5',
                                    alphagram='CEILNOPR')
        AlphagramTag.objects.create(user=user4113, lexicon=america, tag='D4',
                                    alphagram='CEILNOPR')
        AlphagramTag.objects.create(user=cesar, lexicon=csw15, tag='D1',
                                    alphagram='EIMNOPRS')
        AlphagramTag.objects.create(user=cesar, lexicon=america, tag='D2',
                                    alphagram='CINOZ')
        AlphagramTag.objects.create(user=cesar, lexicon=america, tag='D3',
                                    alphagram='AEEGLNOT')

    def test_tag_no_match(self):
        self.create_some_tags()

        sdp = SearchDescription.tags(8, self.america, ['D4'], self.cesar)
        qs = word_search([sdp])

        self.assertEqual(qs.size(), 0)

    def test_tag_single(self):
        self.create_some_tags()

        sdp = SearchDescription.tags(8, self.csw15, ['D4'], self.cesar)
        qs = word_search([sdp])

        self.assertEqual(qs.size(), 1)
        self.assertEqual(set(['AELMOSTU']), qs.alphagram_string_set())
        # Check that it fully populated the question
        logger.debug(qs.questions_array()[0].to_python_full())
        self.assertEqual(qs.questions_array()[0].to_python_full(), {
            'question': 'AELMOSTU',
            'probability': 2477,
            'answers': [{
                'word': 'SOULMATE',
                'def': 'a person with whom one is perfectly suited [n -S]',
                'f_hooks': '',
                'b_hooks': 'S',
                'symbols': '',
                'f_inner': False,
                'b_inner': False,
            }]
        })

    def test_tag_list(self):
        self.create_some_tags()
        sdp = SearchDescription.tags(8, self.america, ['D2', 'D3', 'D4', 'D5'],
                                     self.cesar)
        qs = word_search([sdp])
        logger.debug('Found qs: %s', qs)
        self.assertEqual(qs.size(), 2)
        self.assertEqual(set(['AEEGLNOT', 'CEILNOPR']),
                         qs.alphagram_string_set())
        self.assertTrue(len(qs.questions_array()[0].answers[0].definition) > 0)

    def test_prob_limit_tags(self):
        self.create_some_tags()
        sdp = SearchDescription.tags(5, self.america, ['D2', 'D5'], self.cesar)
        sdp2 = SearchDescription.limit_probability(5, self.america, 1, 1)
        qs = word_search([sdp, sdp2])
        self.assertEqual(qs.size(), 1)
        self.assertEqual(qs.questions_array()[0].alphagram.alphagram, 'AEILT')
        self.assertTrue(len(qs.questions_array()[0].answers[0].definition) > 0)
