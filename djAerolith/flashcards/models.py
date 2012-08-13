from base.models import Alphagram
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

