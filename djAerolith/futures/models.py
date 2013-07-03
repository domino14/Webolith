from django.db import models
from django.contrib.auth.models import User
# Create your models here.


class FutureCategory(models.Model):
    name = models.CharField(max_length=32)
    description = models.CharField(max_length=256)

    def __unicode__(self):
        return '%s' % self.name


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

    def __unicode__(self):
        return '%s' % self.name


class FutureHistory(models.Model):
    """
        If this becomes popular will move this to Cassandra or something
        similar because we'll have large amounts of non-relational data.
    """
    future = models.ForeignKey(Future)
    price = models.IntegerField()
    date = models.DateTimeField()


class Order(models.Model):
    ORDER_TYPE_BUY = 'B'
    ORDER_TYPE_SELL = 'S'
    ORDER_TYPES = (
        (ORDER_TYPE_BUY, 'BUY'),
        (ORDER_TYPE_SELL, 'SELL')
    )
    creator = models.ForeignKey(User, related_name='order_creator')
    filled_by = models.ForeignKey(User, blank=True,
                                  null=True, related_name='order_filler')
    order_type = models.CharField(max_length=1, choices=ORDER_TYPES)
    future = models.ForeignKey(Future)
    quantity = models.IntegerField()
    unit_price = models.IntegerField()
    # Did the order go through?
    filled = models.BooleanField(default=False)
    last_modified = models.DateTimeField(auto_now=True, auto_now_add=True)

    def __unicode__(self):
        return '%s\'s %s (%s), %s shares at %s - %s' % (
            self.creator.username, self.future, self.order_type,
            self.quantity, self.unit_price,
            'FILLED' if self.filled else 'UNFILLED')


class SuccessfulTransaction(models.Model):
    buyer = models.ForeignKey(User, related_name='transaction_buyer')
    seller = models.ForeignKey(User, related_name='transaction_seller')
    future = models.ForeignKey(Future)
    quantity = models.IntegerField()
    unit_price = models.IntegerField()
    created = models.DateTimeField(auto_now_add=True)

    def __unicode__(self):
        return 'Buyer: %s Seller: %s, %s (%s at %s)' % (
            self.buyer.username, self.seller.username, self.future,
            self.quantity, self.unit_price)


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

    def __unicode__(self):
        return '%s\'s wallet: %s points (%s frozen)' % (
            self.user.username, self.points, self.frozen)
