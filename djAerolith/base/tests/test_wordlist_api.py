import json
import logging

from django.test import TestCase
from django.test.client import Client

from accounts.models import AerolithProfile

logger = logging.getLogger(__name__)


class WordwallsAPITest(TestCase):
    fixtures = ['test/lexica.yaml',
                'test/users.json',
                'test/profiles.json',
                'test/word_lists.json']

    USER = 'cesar'
    PASSWORD = 'foobar'

    def setUp(self):
        self.client = Client()
        result = self.client.login(username=self.USER, password=self.PASSWORD)
        self.assertTrue(result)

    def test_lists_get(self):
        resp = self.client.get('/base/api/saved_lists/')
        content = json.loads(resp.content)
        logger.debug('Content: %s', content)
        self.assertEqual(len(content['lists']), 6)

    def test_lists_delete(self):
        resp = self.client.delete('/base/api/saved_lists/',
                                  data=json.dumps([2, 7217]),
                                  content_type='application/json')
        self.assertEqual(resp.content, b'"OK"')
        resp = self.client.get('/base/api/saved_lists/')
        content = json.loads(resp.content)
        self.assertEqual(len(content['lists']), 4)
        profile = AerolithProfile.objects.get(user__username='cesar')
        self.assertEqual(profile.wordwallsSaveListSize,
                         55781 - 11 - 52)

    def test_lists_delete_bad_id(self):
        resp = self.client.delete('/base/api/saved_lists/',
                                  data=json.dumps([2, 7218]),
                                  content_type='application/json')
        self.assertEqual(b'"List id 7218 was not found."', resp.content)
        resp = self.client.get('/base/api/saved_lists/')
        content = json.loads(resp.content)
        # No changes were made.
        self.assertEqual(len(content['lists']), 6)
        profile = AerolithProfile.objects.get(user__username='cesar')
        self.assertEqual(profile.wordwallsSaveListSize, 55781)
