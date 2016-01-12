from django.db import models
from django.contrib.auth.models import User


# class Card(models.Model):
#     user = models.ForeignKey(User)
#     alphagram = models.ForeignKey(Alphagram)
#     num_right = models.IntegerField(default=0)
#     num_wrong = models.IntegerField(default=0)
#     streak = models.IntegerField(default=0)
#     last_correct = models.DateTimeField(null=True)
#     last_quizzed = models.DateTimeField(null=True)
#     tag = models.CharField(max_length=140)
#     difficulty = models.IntegerField(default=0)
#     next_scheduled = models.DateTimeField(null=True)
#     box = models.IntegerField(default=0)

#     class Meta:
#         unique_together = (('user', 'alphagram'),)
