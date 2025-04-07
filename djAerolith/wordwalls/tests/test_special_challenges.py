import re

from django.test import TestCase

from base.models import Lexicon
from lib.word_db_helper import WordDB
from wordwalls.special_challenges import get_by_prob, get_by_vowels


class SpecialChallengeTest(TestCase):
    fixtures = ['test/lexica.json']

    def setUp(self):
        self.lex = Lexicon.objects.get(lexiconName='America')
        self.db = WordDB(lexicon_name='America')

    def test_get_by_prob(self):
        qs = get_by_prob(self.db, [7, 8], [5001, 10000])
        assert len(qs) == 50
        alphas = set()
        for q in qs.questions_array():
            assert (q.alphagram.probability >= 5001 and
                    q.alphagram.probability <= 10000)
            assert (len(q.alphagram.alphagram) >= 7 and
                    len(q.alphagram.alphagram) <= 8)
            alphas.add(q.alphagram.alphagram)
        assert(len(alphas) == 50)

    def test_get_by_vowels(self):
        qs = get_by_vowels(self.lex, [7, 8], [4, 5])
        assert len(qs) == 50
        alphas = set()
        for q in qs.questions_array():
            assert (len(q.alphagram.alphagram) >= 7 and
                    len(q.alphagram.alphagram) <= 8)
            if len(q.alphagram.alphagram) == 7:
                assert len(re.findall('[AEIOU]{1}', q.alphagram.alphagram)) >= 4  # noqa
            if len(q.alphagram.alphagram) == 8:
                assert len(re.findall('[AEIOU]{1}', q.alphagram.alphagram)) >= 5  # noqa
            alphas.add(q.alphagram.alphagram)
        assert(len(alphas) == 50)
