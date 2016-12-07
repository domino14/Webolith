import json
import logging
from datetime import date

from django.test import TestCase, Client, RequestFactory

from wordwalls.api import date_from_request
logger = logging.getLogger(__name__)


class WordwallsSaveListTest(TestCase):
    fixtures = ['test/lexica.json',
                'test/users.json',
                'test/profiles.json',
                'test/word_lists.json',
                'dcNames.json',
                'test/daily_challenge.json',
                'test/daily_challenge_leaderboard.json',
                'test/daily_challenge_leaderboard_entry.json']

    USER = 'user_4627'
    PASSWORD = 'foobar'

    def setUp(self):
        self.client = Client()
        result = self.client.login(username=self.USER, password=self.PASSWORD)
        self.assertTrue(result)

    def test_challenges_played_no_challenges(self):
        # User 4627 boards(challs):
        # 40054 (40233, 2015-10-12), 40055 (40234, 2015-10-12),
        # 40079 (40256, 2015-10-13), 40082 (40260, 2015-10-13),
        # 40128 (40307, 2015-10-15), 40134 (40313, 2015-10-15)
        resp = self.client.get(
            '/wordwalls/api/challenges_played/?lexicon=7&date=2015-10-14')
        self.assertEqual(json.loads(resp.content), [])

    def test_challenges_played_good_date(self):
        # User 4627 boards(challs):
        # 40054 (40233, 2015-10-12), 40055 (40234, 2015-10-12),
        # 40079 (40256, 2015-10-13), 40082 (40260, 2015-10-13),
        # 40128 (40307, 2015-10-15), 40134 (40313, 2015-10-15)
        resp = self.client.get(
            '/wordwalls/api/challenges_played/?lexicon=7&date=2015-10-13')
        self.assertEqual(json.loads(resp.content), [
            {'challengeID': 6}, {'challengeID': 7}])

    def test_good_date_from_request(self):
        self.factory = RequestFactory()
        request = self.factory.get(
            '/wordwalls/api/challenges_played/?lexicon=1&date=2014-03-02')
        dt = date_from_request(request)

        self.assertEqual(dt, date(2014, 3, 2))

    def test_bad_date_from_request(self):
        """ Test that entering a date in a bad format results in today. """
        self.factory = RequestFactory()
        request = self.factory.get(
            '/wordwalls/api/challenges_played/?lexicon=1&date=04032014')
        dt = date_from_request(request)
        # This test might fail if run exactly one nanosecond before midnight.
        self.assertEqual(dt, date.today())
