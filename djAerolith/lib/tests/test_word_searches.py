import logging
import time

from django.test import TestCase

from base.models import Lexicon, User, AlphagramTag
from lib.word_searches import SearchDescription
from lib.word_db_helper import word_search, BadInput
logger = logging.getLogger(__name__)


class SimpleSearchCase(TestCase):
    fixtures = [
        'test/lexica.json'
    ]

    def setUp(self):
        self.america = Lexicon.objects.get(lexiconName='America')

    def test_probability_word_search(self):
        qs = word_search([SearchDescription.lexicon(self.america),
                          SearchDescription.length(8, 8),
                          SearchDescription.probability_range(200, 203)])

        self.assertEqual(qs.size(), 4)

        self.assertEqual(
            ['ADEEGNOR', 'EEGILNOR', 'ADEEGORT', 'AEEGLNOT'],
            qs.alphagram_string_list())
        self.assertTrue(len(qs.questions_array()[0].answers[0].definition) > 0)

    def test_probability_and_points(self):
        qs = word_search([
            SearchDescription.lexicon(self.america),
            SearchDescription.length(8, 8),
            SearchDescription.probability_range(3000, 3010),
            SearchDescription.points(14, 30)
        ])

        self.assertEqual(qs.size(), 4)
        self.assertEqual(
            ['EHILORTY', 'DEHIOPRT', 'DEINORVW', 'CDEINORV'],
            qs.alphagram_string_list())
        self.assertTrue(len(qs.questions_array()[0].answers[0].definition) > 0)

    def test_points(self):
        qs = word_search([
            SearchDescription.lexicon(self.america),
            SearchDescription.length(7, 7),
            SearchDescription.points(40, 100)
        ])
        self.assertEqual(qs.size(), 2)
        self.assertEqual(
            ['AVYYZZZ', 'AIPZZZZ'],
            qs.alphagram_string_list())
        self.assertTrue(len(qs.questions_array()[0].answers[0].definition) > 0)

    def test_num_anagrams(self):
        qs = word_search([
            SearchDescription.lexicon(self.america),
            SearchDescription.length(7, 7),
            SearchDescription.number_anagrams(8, 100)
        ])

        self.assertEqual(qs.size(), 5)
        self.assertEqual(
            ['AEINRST', 'AEGINST', 'AEGINRS', 'EORSSTU', 'EIPRSST'],
            qs.alphagram_string_list())
        self.assertTrue(len(qs.questions_array()[0].answers[0].definition) > 0)

    def test_pts_num_anagrams(self):
        qs = word_search([
            SearchDescription.lexicon(self.america),
            SearchDescription.length(7, 7),
            SearchDescription.number_anagrams(8, 100),
            SearchDescription.points(8, 100),
        ])
        self.assertEqual(qs.size(), 3)
        self.assertEqual(
            ['AEGINST', 'AEGINRS', 'EIPRSST'],
            qs.alphagram_string_list())
        self.assertTrue(len(qs.questions_array()[0].answers[0].definition) > 0)

    def test_alphagram_list(self):
        qs = word_search([
            SearchDescription.lexicon(self.america),
            SearchDescription.alphagram_list(['DEGORU', 'AAAIMNORT', 'DGOS'])
        ])

        self.assertEqual(qs.size(), 3)
        self.assertEqual(
            ['DGOS', 'DEGORU', 'AAAIMNORT'],
            qs.alphagram_string_list())

        self.assertTrue(len(qs.questions_array()[0].answers[0].definition) > 0)

    def test_probability_list(self):
        qs = word_search([
            SearchDescription.lexicon(self.america),
            SearchDescription.length(7, 7),
            SearchDescription.probability_list([92, 73, 85, 61])
        ])
        self.assertEqual(qs.size(), 4)
        self.assertEqual(
            ['AINORST', 'EILNOST', 'EILORST', 'ADENOST'],
            qs.alphagram_string_list())
        self.assertTrue(len(qs.questions_array()[0].answers[0].definition) > 0)

    def test_not_enough_params(self):
        with self.assertRaises(BadInput) as e:
            word_search([SearchDescription.length(7, 7)])
        self.assertEqual(str(e.exception),
                         'search_descriptions must have at least 2 elements')

    def test_no_lexicon(self):
        with self.assertRaises(BadInput) as e:
            word_search([SearchDescription.length(7, 7),
                         SearchDescription.number_anagrams(1, 2)])
        self.assertEqual(
            str(e.exception),
            'The first search description must contain a lexicon.')

    def test_probability_limit_unallowed(self):
        with self.assertRaises(BadInput) as e:
            word_search([
                SearchDescription.lexicon(self.america),
                SearchDescription.length(7, 7),
                SearchDescription.probability_limit(1, 3),
                SearchDescription.probability_list([92, 73, 85, 61]),
            ])
        self.assertTrue('Incompatible query arguments' in str(e.exception))

    def test_probability_limit_second(self):
        qs = word_search([
            SearchDescription.lexicon(self.america),
            SearchDescription.length(7, 7),
            SearchDescription.points(40, 100),
            SearchDescription.probability_limit(2, 2),
        ])
        # Skip AVYYZZZ
        self.assertEqual(['AIPZZZZ'], qs.alphagram_string_list())

    def test_probability_limit_first(self):
        qs = word_search([
            SearchDescription.lexicon(self.america),
            SearchDescription.length(7, 7),
            SearchDescription.points(40, 100),
            SearchDescription.probability_limit(1, 1),
        ])
        self.assertEqual(['AVYYZZZ'], qs.alphagram_string_list())

    def test_probability_limit_many(self):
        qs = word_search([
            SearchDescription.lexicon(self.america),
            SearchDescription.length(7, 7),
            SearchDescription.points(40, 100),
            SearchDescription.probability_limit(1, 50),
        ])
        self.assertEqual(['AVYYZZZ', 'AIPZZZZ'], qs.alphagram_string_list())

    def test_probability_limit_another(self):
        qs = word_search([
            SearchDescription.lexicon(self.america),
            SearchDescription.length(7, 7),
            SearchDescription.probability_limit(3, 4),
            SearchDescription.number_anagrams(8, 100),
        ])

        self.assertEqual(qs.size(), 2)
        self.assertEqual(['AEGINRS', 'EORSSTU'], qs.alphagram_string_list())


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
        with self.assertRaises(BadInput) as e:
            word_search([
                SearchDescription.lexicon(self.america),
                SearchDescription.length(8, 8),
                SearchDescription.tags(['D4'], self.cesar)
            ])
        self.assertEqual(str(e.exception), 'Query returns no results.')

    def test_tag_single(self):
        self.create_some_tags()

        qs = word_search([
            SearchDescription.lexicon(self.csw15),
            SearchDescription.length(8, 8),
            SearchDescription.tags(['D4'], self.cesar)
        ])

        self.assertEqual(qs.size(), 1)
        self.assertEqual(['AELMOSTU'], qs.alphagram_string_list())
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

        qs = word_search([
            SearchDescription.lexicon(self.america),
            SearchDescription.length(8, 8),
            SearchDescription.tags(['D2', 'D3', 'D4', 'D5'], self.cesar)
        ])

        logger.debug('Found qs: %s', qs)
        self.assertEqual(qs.size(), 2)
        self.assertEqual(['AEEGLNOT', 'CEILNOPR'], qs.alphagram_string_list())
        self.assertTrue(len(qs.questions_array()[0].answers[0].definition) > 0)

    def test_more_tags(self):
        self.create_some_tags()

        qs = word_search([
            SearchDescription.lexicon(self.america),
            SearchDescription.length(5, 5),
            SearchDescription.tags(['D2', 'D5'], self.cesar)
        ])

        self.assertEqual(qs.size(), 2)
        self.assertEqual(['AEILT', 'CINOZ'], qs.alphagram_string_list())
        self.assertTrue(len(qs.questions_array()[0].answers[0].definition) > 0)


class MassiveTagSearchCase(TestCase):
    fixtures = [
        'test/lexica.json',
        'test/users.json',
        'test/profiles.json'
    ]

    def create_some_tags(self):
        self.america = Lexicon.objects.get(lexiconName='America')
        self.cesar = User.objects.get(username='cesar')
        t = time.time()

        qs = word_search([
            SearchDescription.lexicon(self.america),
            SearchDescription.length(8, 8),
            SearchDescription.probability_range(5001, 8500),
        ])
        logger.debug('Initial word search completed in %s seconds',
                     time.time() - t)
        self.assertEqual(qs.size(), 3500)
        # Create hella tags.
        for q in qs.questions_array():
            AlphagramTag.objects.create(user=self.cesar, lexicon=self.america,
                                        tag='D4',
                                        alphagram=q.alphagram.alphagram)
        logger.debug('And time elapsed after tag creation: %s',
                     time.time() - t)

    def test_tag_search(self):
        self.create_some_tags()
        t = time.time()
        qs = word_search([
            SearchDescription.lexicon(self.america),
            SearchDescription.length(8, 8),
            SearchDescription.probability_range(5001, 7500),
            SearchDescription.tags(['D4'], self.cesar),
        ])
        logger.debug('Tag search completed in %s seconds', time.time() - t)
        self.assertEqual(qs.size(), 2500)

