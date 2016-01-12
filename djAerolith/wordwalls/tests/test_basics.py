import unittest
from wordwalls.challenges import toughies_challenge_date
from datetime import date
#from django.test import TestCase
#from django.contrib.auth.models import User


class ChallengeDatesTestCase(unittest.TestCase):
    def testToughieChallengeDates(self):
        self.assertEqual(toughies_challenge_date(date(2020, 12, 9)),
                         date(2020, 12, 8))  # wed, tues
        self.assertEqual(toughies_challenge_date(date(2020, 12, 8)),
                         date(2020, 12, 8))  # tues, tues
        self.assertEqual(toughies_challenge_date(date(2012, 1, 9)),
                         date(2012, 1, 3))  # mon, prev tuesday
        self.assertEqual(toughies_challenge_date(date(2012, 1, 7)),
                         date(2012, 1, 3))  # sat, prev tues
        self.assertEqual(toughies_challenge_date(date(2012, 1, 2)),
                         date(2011, 12, 27))  # mon, prev tuesday
