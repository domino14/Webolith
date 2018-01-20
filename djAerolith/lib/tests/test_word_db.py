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
        self.assertEqual(word.lexicon_symbols, '$+')
        self.assertEqual(word.front_hooks, '')
        self.assertEqual(word.back_hooks, '')
        self.assertEqual(word.inner_front_hook, True)
        self.assertEqual(word.inner_back_hook, True)
        self.assertTrue('PARTY' in word.definition)
        self.assertEqual(word.alphagram, 'AEIPRSTT')

    def test_words_data_single(self):
        words = self.db.get_words_data(['PARTIEST'])
        self.assertEqual(len(words), 1)
        self.assertEqual(words[0].word, 'PARTIEST')
        self.assertEqual(words[0].lexicon_symbols, '$+')
        self.assertEqual(words[0].front_hooks, '')
        self.assertEqual(words[0].back_hooks, '')
        self.assertEqual(words[0].inner_front_hook, True)
        self.assertEqual(words[0].inner_back_hook, True)
        self.assertTrue('PARTY' in words[0].definition)
        self.assertEqual(words[0].alphagram, 'AEIPRSTT')

    def test_words_data_multiple(self):
        words = self.db.get_words_data(['PARTIEST', 'GAMODEME'])
        self.assertEqual(len(words), 2)

        self.assertEqual(words[0].alphagram, 'ADEEGMMO')
        self.assertEqual(words[0].word, 'GAMODEME')
        self.assertEqual(words[0].lexicon_symbols, '')
        self.assertEqual(words[0].front_hooks, '')
        self.assertEqual(words[0].back_hooks, 'S')
        self.assertEqual(words[0].inner_front_hook, False)
        self.assertEqual(words[0].inner_back_hook, False)
        self.assertTrue('organisms' in words[0].definition)

        self.assertEqual(words[1].word, 'PARTIEST')
        self.assertEqual(words[1].lexicon_symbols, '$+')
        self.assertEqual(words[1].front_hooks, '')
        self.assertEqual(words[1].back_hooks, '')
        self.assertEqual(words[1].inner_front_hook, True)
        self.assertEqual(words[1].inner_back_hook, True)
        self.assertTrue('PARTY' in words[1].definition)
        self.assertEqual(words[1].alphagram, 'AEIPRSTT')

    def test_word_not_found(self):
        word = self.db.get_word_data('FOOBARBAZ')
        self.assertTrue(word is None)


class WordDBSpanishTest(TestCase):
    def setUp(self):
        self.db = WordDB(lexicon_name='FISE09')

    def test_word_data(self):
        word = self.db.get_word_data('ÑAME')
        self.assertEqual(word.word, 'ÑAME')
        self.assertEqual(word.lexicon_symbols, '')
        self.assertEqual(word.front_hooks, '')
        self.assertEqual(word.back_hooks, 'S')
        self.assertEqual(word.inner_front_hook, True)
        self.assertEqual(word.inner_back_hook, False)
        self.assertEqual(word.alphagram, 'AEMÑ')
