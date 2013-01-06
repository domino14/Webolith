# Aerolith 2.0: A web-based word game website
# Copyright (C) 2011 Cesar Del Solar
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

# To contact the author, please email delsolar at gmail dot com


from django.utils import unittest
from django.test import TestCase
from django.contrib.auth.models import User
class TableTest(TestCase):
    # blah this doesn't work.
    def setup(self):
        user = User.objects.create_user('testuser', 'testuser@aerolith.org', 'secret')
        user.save()
        self.client.login(username="testuser", password="secret")

    def test_create_table_searchparams(self):
        response = self.client.post('/wordwalls', {'searchParamsSubmit': 'Play!',
                                                    'wordLength': '7',
                                                    'quizTime': '4',
                                                    'lexicon': 'OWL2',
                                                    'probabilityMin': '1001',
                                                    'probabilityMax': '1500',
                                                    'playerMode': 1}, follow=True)
        print response