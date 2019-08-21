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
from datetime import datetime, timedelta
import logging

from django.db import models
from django.db.models.signals import post_save
from django.contrib.auth.models import User
from django.utils import timezone

from base.models import Lexicon

logger = logging.getLogger(__name__)

SOON_DAYS = 14


def getLexicon(request=None):
    if not request:
        return Lexicon.objects.get(lexiconName='NWL18')
    elif request.LANGUAGE_CODE == 'es':
        return Lexicon.objects.get(lexiconName='FISE2')
    elif request.LANGUAGE_CODE == 'pl':
        return Lexicon.objects.get(lexiconName='OSPS40')
    return Lexicon.objects.get(lexiconName='NWL18')


class AerolithProfile(models.Model):
    user = models.OneToOneField(User,
                                on_delete=models.CASCADE)

    coins = models.IntegerField(default=0)
    profile = models.CharField(max_length=2000, blank=True)
    rating = models.IntegerField(default=0)

    NONE_MTYPE = 0
    BRONZE_MTYPE = 1
    SILVER_MTYPE = 2
    GOLD_MTYPE = 3

    MEMBERSHIP_TYPES = (
        (NONE_MTYPE, "None"),
        (BRONZE_MTYPE, "Bronze"),
        (SILVER_MTYPE, "Silver"),
        (GOLD_MTYPE, "Gold"),
    )

    member = models.BooleanField(default=False)
    membershipType = models.IntegerField(choices=MEMBERSHIP_TYPES,
                                         default=NONE_MTYPE)
    membershipExpiry = models.DateTimeField(null=True, blank=True)
    stripe_user_id = models.CharField(max_length=100, blank=True,
                                      db_index=True)
    # specific per game
    customWordwallsStyle = models.CharField(max_length=1000, blank=True)
    wordwallsSaveListSize = models.IntegerField(default=0)

    # project-wide
    defaultLexicon = models.ForeignKey(Lexicon, default=getLexicon,
                                       on_delete=models.SET_DEFAULT)
    avatarUrl = models.CharField(null=True, blank=True, max_length=512)
    additional_data = models.TextField(default='{}', blank=True)

    def __str__(self):
        return "Profile for " + self.user.username

    @property
    def membership_expires_soon(self):
        if not self.membershipExpiry:
            return False
        return (timezone.now() + timedelta(days=SOON_DAYS) >
                self.membershipExpiry)

    @property
    def membership_has_expired(self):
        if not self.membershipExpiry:
            return False
        return timezone.now() > self.membershipExpiry


def user_registered_handler(sender, **kwargs):
    if kwargs['created'] and not kwargs.get('raw', False):
        profile = AerolithProfile()
        profile.user = kwargs['instance']
        profile.save()


post_save.connect(user_registered_handler, User)
