from django.db import models
from django.contrib.auth.models import User
from base.models import Lexicon
from tablegame.models import GenericTableGameModel

WORDSTRUCK_TYPE = 1
WORDDASH_TYPE = 2

class WordGrid(models.Model):
    lexicon = models.ForeignKey(Lexicon)
    timeSecs = models.IntegerField() # the number of seconds alloted for this grid
    gridSizeX = models.IntegerField()
    gridSizeY = models.IntegerField()
    letters = models.CharField(max_length=255)  # max for a 15x15 board
    dateCreated = models.DateTimeField(auto_now_add=True)
    def __unicode__(self):
        return '%d) %d x %d (%s)' % (self.pk, self.gridSizeX, self.gridSizeY, self.lexicon.lexiconName)

class WordGridRecord(models.Model):
    grid = models.ForeignKey(WordGrid)
    points = models.IntegerField()
    user = models.ForeignKey(User)
    whenAchieved = models.DateTimeField(auto_now_add=True)
    pathTaken = models.TextField()  # description of how user achieved this record
    
class WordgridsTable(GenericTableGameModel):
    currentGrid = models.ForeignKey(WordGrid)
    challenge = models.CharField(max_length=8)

    
