from django.db import models
from django.contrib.auth.models import User
# Create your models here.


class FutureCategory(models.Model):
    name = models.CharField(max_length=32)
    description = models.CharField(max_length=256)


class Future(models.Model):
    """
        A betting Future.
    """
    name = models.CharField(max_length=64)
    description = models.CharField(max_length=256)
    is_open = models.BooleanField(default=False)
    last_buy = models.IntegerField()
    last_trade_date = models.DateTimeField(auto_now=True, null=True)
    volume = models.IntegerField()
    category = models.ForeignKey(FutureCategory)


class FutureHistory(models.Model):
    """
        If this becomes popular will move this to Cassandra or something
        similar because we'll have large amounts of non-relational data.
    """
    future = models.ForeignKey(Future)
    price = models.IntegerField()
    date = models.DateTimeField()


class Transaction(models.Model):
    future = models.ForeignKey(Future)
    quantity = models.IntegerField()
    buyer = models.ForeignKey(User, null=True,
                              related_name='transaction_buyer')
    seller = models.ForeignKey(User, null=True,
                               related_name='transaction_seller')
    unit_price = models.IntegerField()
    # Did the transaction go through?
    executed = models.BooleanField(default=False)


class Wallet(models.Model):
    """
        A user's wallet.
    """
    user = models.ForeignKey(User)
    points = models.IntegerField()
    frozen = models.IntegerField()
    # A JSON dump of {"futureId": "numShares"}. numShares can be negative
    # if user short-sells.
    shares_owned = models.TextField()
