import json
import logging
from datetime import date

from django.test import TestCase, Client, RequestFactory
from django.db import connection

from wordwalls.api import date_from_request_dict
from base.models import WordList
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
        dt = date_from_request_dict(request.GET)

        self.assertEqual(dt, date(2014, 3, 2))

    def test_bad_date_from_request(self):
        """ Test that entering a date in a bad format results in today. """
        self.factory = RequestFactory()
        request = self.factory.get(
            '/wordwalls/api/challenges_played/?lexicon=1&date=04032014')
        dt = date_from_request_dict(request.GET)
        # This test might fail if run exactly one nanosecond before midnight.
        self.assertEqual(dt, date.today())

    def test_future_date_from_request(self):
        """ Test that entering a future date results in today. """
        self.factory = RequestFactory()
        request = self.factory.get(
            '/wordwalls/api/challenges_played/?lexicon=1&date=2900-01-03')
        dt = date_from_request_dict(request.GET)
        # This test might fail if run exactly one nanosecond before midnight.
        self.assertEqual(dt, date.today())


class WordwallsNewChallengeTest(TestCase):
    """ Test the new challenge behavior, list replacement etc """
    fixtures = ['test/lexica.json',
                'test/users.json',
                'test/profiles.json',
                'test/word_lists.json',
                'dcNames.json',
                'test/daily_challenge.json']

    USER = 'cesar'
    PASSWORD = 'foobar'

    def setUp(self):
        # XXX: Figure out a better way of doing this.
        cursor = connection.cursor()
        cursor.execute("select setval('%s_id_seq', %d, True)" % (
            'wordwalls_savedlist', 123456))
        self.client = Client()
        result = self.client.login(username=self.USER, password=self.PASSWORD)
        self.assertTrue(result)

    def test_replace_challenge(self):
        result = self.client.post('/wordwalls/', {
            'action': 'challengeSubmit',
            'lexicon': 7,
            'challenge': 14,
            'challengeDate': '2013-11-29'
        })
        content = json.loads(result.content)
        response = self.client.get(content['url'])
        addl_params = json.loads(response.context['addParams'])
        tablenum = int(response.context['tablenum'])
        self.assertEqual(addl_params['tempListName'],
                         'America Today\'s 15s - 2013-11-29')
        result = self.client.post('/wordwalls/api/new_challenge/',
                                  data=json.dumps({'tablenum': tablenum,
                                                   'lexicon': 1,
                                                   'challenge': 7,
                                                   'date': '2016-10-12'}),
                                  content_type='application/json')
        result_obj = json.loads(result.content)
        self.assertEqual(result_obj['tablenum'], tablenum)
        expected_list_name = 'CSW15 Today\'s 8s - 2016-10-12'
        self.assertEqual(result_obj['list_name'], expected_list_name)
        wl = WordList.objects.get(name=expected_list_name)
        orig_questions = json.loads(wl.origQuestions)
        self.assertEqual(len(orig_questions), 50)
        self.assertEqual(len(orig_questions[28]['q']), 8)

