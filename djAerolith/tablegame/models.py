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
from base.models import Lexicon


# Create your models here.
class GenericTableGameModel(models.Model):
    WORDWALLS_GAMETYPE = 1
    WORDGRIDS_GAMETYPE = 2

    SINGLEPLAYER_GAME = 1
    MULTIPLAYER_GAME = 2

    GAME_TYPES = (
        (WORDWALLS_GAMETYPE, "WordWalls"),
        (WORDGRIDS_GAMETYPE, "WordGrids"),
    )
    PLAYER_TYPES = (
        (SINGLEPLAYER_GAME, "SinglePlayer"),
        (MULTIPLAYER_GAME, "MultiPlayer"),
    )
    lexicon = models.ForeignKey(Lexicon)
    host = models.ForeignKey(User, related_name="%(app_label)s_%(class)s_host")
    inTable = models.ManyToManyField(
        User, related_name="%(app_label)s_%(class)s_inTable")
    lastActivity = models.DateTimeField(auto_now=True)
    currentGameState = models.TextField()
    gameType = models.IntegerField(choices=GAME_TYPES)
    playerType = models.IntegerField(choices=PLAYER_TYPES)

    # table number will be a primary id
    def __unicode__(self):
        return "Table game #%d - last activity: %s" % (self.pk,
                                                       self.lastActivity)

    class Meta:
        abstract = True


class Presence(models.Model):
    """
    A database-backed presence model. We should use this to keep
    track of who is currently connected, in the lobby, or within tables.

    This should be the source of truth for when we send presence messages
    to everyone.

    """
    user = models.ForeignKey(User)
    last_ping_time = models.DateTimeField(db_index=True, auto_now=True)
    last_left = models.DateTimeField(null=True)
    # The room is either 'lobby' or a table number for now. Maybe use UUIDs
    # later.
    room = models.CharField(max_length=32, db_index=True)

    class Meta:
        unique_together = ('user', 'room')
