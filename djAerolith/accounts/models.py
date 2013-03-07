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
from django.db import models
from django.contrib.auth.models import User
from registration.signals import user_activated
from base.models import Lexicon


def getLexicon():
    return Lexicon.objects.get(lexiconName='OWL2')


class AerolithProfile(models.Model):
    user = models.ForeignKey(User, unique=True)

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

    # specific per game
    customWordwallsStyle = models.CharField(max_length=1000, blank=True)
    wordwallsSaveListSize = models.IntegerField(default=0)
    wordwallsMedals = models.TextField(null=True, blank=True)

    # project-wide
    defaultLexicon = models.ForeignKey(Lexicon, default=getLexicon)

    def __unicode__(self):
        return "Profile for " + self.user.username


def userActivatedHandler(sender, **kwargs):
    for key in kwargs:
        if key == 'user':
            #print "User: ", kwargs[key].username, "activated!"
            profile = AerolithProfile()
            profile.user = kwargs[key]
            profile.save()

user_activated.connect(userActivatedHandler)


    # specific tables
