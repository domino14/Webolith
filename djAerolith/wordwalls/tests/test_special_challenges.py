from django.test import TestCase

from lib.word_db_helper import WordDB
from wordwalls.special_challenges import get_by_prob


class SpecialChallengeTest(TestCase):
    def setUp(self):
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