import json
import logging

from django.test import TestCase, Client
from django.db import connection

from wordwalls.models import WordwallsGameModel
logger = logging.getLogger(__name__)


class WordwallsSaveListTest(TestCase):
    fixtures = ['test/lexica.json',
                'test/users.json',
                'test/profiles.json',
                'test/word_lists.json',
                'dcNames.json',
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
        result = self.client.post('/wordwalls/', {
            'action': 'searchParamsSubmit',
            'quizTime': 5,
            'lexicon': 1,
            'num_questions': 60,
            'wordLength': '8',
            'probabilityMin': 523,
            'probabilityMax': 784
        })
        # XXX: Fix this API to return proper status codes in the future.
        # self.assertEqual(result.status_code, 200)
        logger.debug(result.content)
        content = json.loads(result.content)
        self.assertTrue(content['success'])
        self.assertTrue('/wordwalls/table/' in content['url'])
        # And access the table.
        response = self.client.get(content['url'])
        # Test that the temporary list name was generated correctly.
        addl_params = json.loads(response.context['addParams'])
        self.assertEqual(addl_params['tempListName'],
                         'CSW15 8s (523 - 784)')

    def test_unique_temp_list_name(self):
        # This would create a list with the same name for this user.
        result = self.client.post('/wordwalls/', {
            'action': 'searchParamsSubmit',
            'quizTime': 5,
            'lexicon': 7,
            'num_questions': 50,
            'wordLength': '8',
            'probabilityMin': 151,
            'probabilityMax': 200
        })
        content = json.loads(result.content)
        response = self.client.get(content['url'])
        # Test that the temporary list name was generated correctly.
        addl_params = json.loads(response.context['addParams'])
        self.assertEqual(addl_params['tempListName'],
                         'America 8s (151 - 200) (2)')

    def test_play_existing_challenge(self):
        result = self.client.post('/wordwalls/', {
            'action': 'challengeSubmit',
            'lexicon': 1,
            'challenge': 17,
            'challengeDate': '2015-12-08'
        })
        content = json.loads(result.content)
        response = self.client.get(content['url'])
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
        result = self.client.post('/wordwalls/', {
            'action': 'challengeSubmit',
            'lexicon': 7,
            'challenge': 14,
            'challengeDate': '2013-11-29'
        })
        content = json.loads(result.content)
        response = self.client.get(content['url'])
        addl_params = json.loads(response.context['addParams'])
        tablenum = response.context['tablenum']
        self.assertEqual(addl_params['tempListName'],
                         'America Today\'s 15s - 2013-11-29')
        word_list = WordwallsGameModel.objects.get(pk=tablenum).word_list
        qs = json.loads(word_list.origQuestions)
        self.assertEqual(len(qs), 50)
        self.assertEqual(len(qs[17]['q']), 15)
