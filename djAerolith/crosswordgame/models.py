from django.db import models
from django.contrib.auth.models import User


# Create your models here.
class CrosswordGameFile(models.Model):
    parsedDump = models.TextField()
    player1 = models.ForeignKey(User, null=True, related_name='player1')
    player2 = models.ForeignKey(User, null=True, related_name='player2')
    org_id = models.CharField(max_length=64, unique=True)
    created = models.DateTimeField(auto_now_add=True)
    lastUpdated = models.DateTimeField(auto_now=True, auto_now_add=True)
