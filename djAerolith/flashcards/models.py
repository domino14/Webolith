from base.models import Alphagram, Lexicon
from django.db import models
from django.contrib.auth.models import User


class Question(models.Model):
    user = models.ForeignKey(User)
    correct = models.IntegerField()
    incorrect = models.IntegerField()
    streak = models.IntegerField()
    last_correct = models.DateTimeField()
    alphagram = models.ForeignKey(Alphagram)
    next_scheduled = models.DateTimeField()
    cardbox = models.IntegerField()


class IKMRun(models.Model):
    lexicon = models.ForeignKey(Lexicon)
    user = models.ForeignKey(User)
    alphagramOrder = models.TextField()
    qindex = models.IntegerField()
    answers = models.TextField()
    started = models.DateTimeField(auto_now_add=True)
    lastSeen = models.DateTimeField(auto_now=True)
    description = models.TextField(blank=True)
    additionalData = models.TextField()
