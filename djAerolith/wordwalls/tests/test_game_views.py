import json
import logging

from django.test import TestCase, Client
from django.db import connection

from wordwalls.models import WordwallsGameModel
logger = logging.getLogger(__name__)


class WordwallsGameStartTest(TestCase):
    fixtures = ['test/lexica.yaml',
                'test/users.json',
                'test/profiles.json',
                'test/word_lists.json',
                'challenge_names.json',
                'test/daily_challenge.json'
                ]

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

    def test_start_by_search_params(self):
        result = self.client.post(
            '/wordwalls/api/new_search/',
            data=json.dumps({
                'desiredTime': 5,
                'lexicon': 1,
                'questionsPerRound': 60,
                'searchCriteria': [{
                    'searchType': 'length',
                    'minValue': 8,
                    'maxValue': 8,
                }, {
                    'searchType': 'probability_range',
                    'minValue': 523,
                    'maxValue': 784,
                }],
                'tablenum': 0,
            }),
            content_type='application/json')
        self.assertEqual(result.status_code, 200)
        content = json.loads(result.content)
        response = self.client.get('/wordwalls/table/{0}/'.format(
            content['tablenum']))
        # Test that the temporary list name was generated correctly.
        addl_params = json.loads(response.context['addParams'])
        self.assertEqual(addl_params['tempListName'],
                         'CSW15 8s (523 - 784)')

    def test_unique_temp_list_name(self):
        # This would create a list with the same name for this user.
        result = self.client.post(
            '/wordwalls/api/new_search/', data=json.dumps({
                'desiredTime': 5,
                'lexicon': 7,
                'questionsPerRound': 50,
                'searchCriteria': [{
                    'searchType': 'length',
                    'minValue': 8,
                    'maxValue': 8,
                }, {
                    'searchType': 'probability_range',
                    'minValue': 151,
                    'maxValue': 200,
                }],
                'tablenum': 0,
            }),
            content_type='application/json')
        self.assertEqual(result.status_code, 200)
        content = json.loads(result.content)
        response = self.client.get('/wordwalls/table/{0}/'.format(
            content['tablenum']))
        # Test that the temporary list name was generated correctly.
        addl_params = json.loads(response.context['addParams'])
        self.assertEqual(addl_params['tempListName'],
                         'America 8s (151 - 200) (2)')

    def test_play_existing_challenge(self):
        result = self.client.post(
            '/wordwalls/api/new_challenge/',
            data=json.dumps({
                'lexicon': 1,
                'challenge': 17,
                'date': '2015-12-08',
                'tablenum': 0,
            }),
            content_type='application/json')
        self.assertEqual(result.status_code, 200)
        content = json.loads(result.content)
        response = self.client.get('/wordwalls/table/{0}/'.format(
            content['tablenum']))
        addl_params = json.loads(response.context['addParams'])
        tablenum = response.context['tablenum']
        self.assertEqual(addl_params['tempListName'],
                         'CSW15 Bingo Marathon - 2015-12-08')
        word_list = WordwallsGameModel.objects.get(pk=tablenum).word_list
        qs = json.loads(word_list.origQuestions)
        self.assertEqual(len(qs), 100)
        # Test a bunch of bingos to make sure we have the right list.
        # (See daily_challenge.json fixture)
        self.assertTrue({'q': 'EINORTU', 'a': ['ROUTINE']} in qs)
        self.assertTrue({'q': 'AEEIKPR', 'a': ['PEAKIER']} in qs)
        self.assertTrue({'q': 'BDENOPRU', 'a': ['PREBOUND', 'UNPROBED']} in qs)
        self.assertTrue({'q': 'ABCEEHRS', 'a': ['BREACHES']} in qs)
        self.assertTrue({'q': 'AFOORST', 'a': ['FOOTRAS']} in qs)

    def test_play_new_challenge(self):
        result = self.client.post(
            '/wordwalls/api/new_challenge/',
            data=json.dumps({
                'lexicon': 7,
                'challenge': 14,
                'date': '2013-11-29',
                'tablenum': 0,
            }),
            content_type='application/json')
        content = json.loads(result.content)
        response = self.client.get('/wordwalls/table/{0}/'.format(
            content['tablenum']))
        addl_params = json.loads(response.context['addParams'])
        tablenum = response.context['tablenum']
        self.assertEqual(addl_params['tempListName'],
                         'America Today\'s 15s - 2013-11-29')
        word_list = WordwallsGameModel.objects.get(pk=tablenum).word_list
        qs = json.loads(word_list.origQuestions)
        self.assertEqual(len(qs), 50)
        self.assertEqual(len(qs[17]['q']), 15)
