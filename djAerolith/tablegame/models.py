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
    def __str__(self):
        return "Table game #%d - last activity: %s" % (self.pk,
                                                       self.lastActivity)

    def is_multiplayer(self):
        return self.playerType == GenericTableGameModel.MULTIPLAYER_GAME

    class Meta:
        abstract = True
