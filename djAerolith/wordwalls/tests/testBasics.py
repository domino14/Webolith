from django.utils import unittest

class ChallengeTestCase(unittest.TestCase):
    def testToughieChallengeDates(self):
        from wordwalls.management.commands.genMissedBingoChalls import challengeDateFromReqDate
        from datetime import date
        self.assertEqual(challengeDateFromReqDate(date(2020, 12, 9)), date(2020, 12, 8)) # wed, tues
        self.assertEqual(challengeDateFromReqDate(date(2020, 12, 8)), date(2020, 12, 8)) # tues, tues
        self.assertEqual(challengeDateFromReqDate(date(2012, 1, 9)), date(2012, 1, 3))  # mon, prev tuesday
        self.assertEqual(challengeDateFromReqDate(date(2012, 1, 7)), date(2012, 1, 3)) # sat, prev tues
        self.assertEqual(challengeDateFromReqDate(date(2012, 1, 2)), date(2011, 12, 27)) # mon, prev tuesday