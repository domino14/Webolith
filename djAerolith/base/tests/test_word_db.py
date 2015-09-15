"""
Test the word database util functions.

"""

from unittest import TestCase
from lib.word_db_helper import WordDB


class WordDBTest(TestCase):
    def setUp(self):
        self.db = WordDB(lexicon_name='America')

    def test_word_data(self):
        word = self.db.get_word_data('PARTIEST')
        self.assertEqual(word.word, 'PARTIEST')
        self.assertEqual(word.lexiconSymbols, '+$')
        self.assertEqual(word.front_hooks, '')
        self.assertEqual(word.back_hooks, '')
        self.assertEqual(word.inner_front_hook, True)
        self.assertEqual(word.inner_back_hook, True)
        self.assertTrue('party' in word.definition)
        self.assertEqual(word.alphagram, 'AEIPRSTT')

    def test_alphagram_data(self):
        alpha = self.db.get_alphagram_data('AEINRST')
        self.assertEqual(alpha.alphagram, 'AEINRST')
        self.assertEqual(alpha.length, 7)
        self.assertEqual(alpha.probability, 11)
        self.assertEqual(alpha.combinations, 3006072)

    def test_word_not_found(self):
        word = self.db.get_word_data('FOOBARBAZ')
        self.assertTrue(word is None)

    def test_alphagram_not_found(self):
        alpha = self.db.get_alphagram_data('ABCDEFGH')
        self.assertTrue(alpha is None)
