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


# class TableTest(TestCase):
#     # blah this doesn't work.
#     def setup(self):
#         user = User.objects.create_user('testuser', 'testuser@aerolith.org',
#                                         'secret')
#         user.save()
#         self.client.login(username="testuser", password="secret")

#     def test_create_table_searchparams(self):
#         response = self.client.post(
#             '/wordwalls', {'searchParamsSubmit': 'Play!',
#                            'wordLength': '7',
#                            'quizTime': '4',
#                            'lexicon': 'OWL2',
#                            'probabilityMin': '1001',
#                            'probabilityMax': '1500',
#                            'playerMode': 1}, follow=True)
#         print response
