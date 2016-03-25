import json
import logging

from django.test import TestCase
from django.test.client import Client

logger = logging.getLogger(__name__)


class WordwallsAPITest(TestCase):
    fixtures = ['test/lexica.json',
                'test/users.json',
                'test/profiles.json',
                'test/word_lists.json']

    USER = 'cesar'
    PASSWORD = 'bar'

    def setUp(self):
        self.client = Client()
        result = self.client.login(username=self.USER, password=self.PASSWORD)
        self.assertTrue(result)

    def test_lists_get(self):
        resp = self.client.get('/base/api/saved_lists/')
        content = json.loads(resp.content)
        logger.debug('Content: %s', content)
        self.assertEqual(len(content), 4)
