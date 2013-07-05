"""
This file demonstrates writing tests using the unittest module. These will pass
when you run "manage.py test".

Replace this with more appropriate tests for your application.
"""

from django.test import TestCase
from futures.views import process_order
from futures.models import (Order, Future, Wallet, SuccessfulTransaction,
                            FutureHistory)
import json
from django.contrib.auth.models import User
import logging
logger = logging.getLogger(__name__)


class ValidationTest(TestCase):
    fixtures = ['users.json', 'future_categories.json', 'futures.json',
                'wallets.json']

    def test_basic_validator(self):
        wallet = Wallet.objects.get(pk=2)
        future = Future.objects.get(pk=3)
        response = process_order(10000, 25, wallet, 'buy', future)
        self.assertContains(response, 'cannot spend', status_code=400)


class OrderTest(TestCase):
    fixtures = ['users.json', 'future_categories.json', 'futures.json',
                'wallets.json', 'orders.json']

    def compare_transactions(self, t1, t2):
        """
            Returns True if the transactions have similar entries,
            but not necessarily the same created date or database index.
        """
        return (t1.buyer == t2.buyer and t1.seller == t2.seller and
                t1.future == t2.future and t1.quantity == t2.quantity and
                t1.unit_price == t2.unit_price)

    def test_order_1(self):
        user = User.objects.get(pk=8)
        # Want to buy future "Jesse Day".
        # There is a sell order of 8 for 600, a buy order of 4 for 100,
        # a sell order of 4 for 325, a buy order of 4 for 275 in the fixture.
        response = process_order(15, 650,
                                 Wallet.objects.get(user=user),
                                 'buy',
                                 Future.objects.get(pk=4))
        # Now get the new orders for people.
        # First, get the order that was just created by this test user.
        order = Order.objects.all().order_by('-pk')[0]
        self.assertEqual(order.filled, False)
        self.assertEqual(order.quantity, 3)  # Should be 15 - (8 + 4)
        self.assertEqual(order.unit_price, 650)  # Unchanged
        # Get the filled orders.
        order_1 = Order.objects.get(pk=9)  # The 325 S
        order_2 = Order.objects.get(pk=3)  # The 650 S
        self.assertEqual(order_1.filled, True)
        self.assertEqual(order_2.filled, True)
        self.assertEqual(order_1.filled_by, user)
        self.assertEqual(order_2.filled_by, user)
        # Fetch new updated future.
        future = Future.objects.get(pk=4)
        self.assertEqual(future.last_buy, 600)
        self.assertEqual(future.bid, 650)
        self.assertEqual(future.ask, None)
        self.assertEqual(future.volume, 12)
        history = FutureHistory.objects.filter(future=future)
        logger.debug(history)
        self.assertEqual(history.count(), 2)
        self.assertEqual(history[0].price, 325)
        self.assertEqual(history[1].price, 600)
        transactions = SuccessfulTransaction.objects.filter(future=future)
        self.assertEqual(transactions.count(), 2)

        self.assertTrue(self.compare_transactions(
            transactions[0], SuccessfulTransaction(
                buyer=user, seller=order_1.creator, future=future,
                quantity=4, unit_price=325)))
        self.assertTrue(self.compare_transactions(
            transactions[1], SuccessfulTransaction(
                buyer=user, seller=order_2.creator, future=future,
                quantity=8, unit_price=600)))
        # Wallets.
        wallet = Wallet.objects.get(user=user)
        wallet_1 = Wallet.objects.get(user=order_1.creator)
        wallet_2 = Wallet.objects.get(user=order_2.creator)
        key = '%s' % future.pk
        self.assertEqual(json.loads(wallet.shares_owned)[key], 12)
        self.assertEqual(wallet.points, 10000 - (4 * 325 + 8 * 600))
        self.assertEqual(wallet_1.points, 10000 + (4 * 325))
        self.assertEqual(wallet_2.points, 10000 + (8 * 600))

    def test_order_2(self):
        """
            Test that orders are prioritized by price then chronologically.
        """
        user = User.objects.get(pk=8)
        wallet = Wallet.objects.get(user=user)
        # Want to buy future "Jesse Day".
        # There is a sell order of 8 for 600, a buy order of 4 for 100,
        # a sell order of 4 for 325, a buy order of 4 for 275 in the fixture.
        future = Future.objects.get(pk=4)
        response = process_order(4, 600, wallet, 'buy', future)
        # Get my order
        order = Order.objects.all().order_by('-pk')[0]
        self.assertEqual(order.filled, True)
        self.assertEqual(order.unit_price, 600)  # Unchanged
        # Get the matching orders.
        order_1 = Order.objects.get(pk=9)  # The 325 S
        order_2 = Order.objects.get(pk=3)  # The 650 S
        self.assertEqual(order_1.filled, True)
        self.assertEqual(order_2.filled, False)
        self.assertEqual(order_1.filled_by, user)

    def test_order_3(self):
        """
            Test second priority (chronologically).
        """
        user = User.objects.get(pk=1)
        wallet = Wallet.objects.get(user=user)
        # Want to buy future "Nigel Richards"
        # There's a buy order for 10@155, sell for 12@600, sell for 5@600
        future = Future.objects.get(pk=1)
        response = process_order(5, 620, wallet, 'buy', future)
        # Get my order.
        order = Order.objects.all().order_by('-pk')[0]
        self.assertEqual(order.filled, True)
        self.assertEqual(order.unit_price, 620)  # Unchanged
        # Get the matching orders.
        order_1 = Order.objects.get(pk=10)  # The 12 orders
        order_2 = Order.objects.get(pk=12)  # The 5 orders
        self.assertEqual(order_1.filled, False)  # Not fully filled
        self.assertEqual(order_2.filled, False)
        self.assertEqual(order_1.quantity, 7)   # Updated quantity.
        self.assertEqual(order_2.quantity, 5)   # This order never changed.
        self.assertEqual(order.filled_by, order_1.creator)

    def test_short_sell_validation(self):
        """
            We can't short sell if we're going to lose more money on it.
        """
        user = User.objects.get(pk=1)
        wallet = Wallet.objects.get(user=user)
        # Want to short-sell "Nigel Richards".
        future = Future.objects.get(pk=1)
        response = process_order(11, 800, wallet, 'sell', future)
        # We don't own Nigel, if event happens we stand to lose (1000 * 11)
        # which is more than this user's default wallet.
        self.assertContains(response, 'cannot short-sell', status_code=400)

    def test_simultaneous_sell_short(self):
        """
            Can't short-sell and regular sell the same shares simultaneously.
        """
        user = User.objects.get(pk=1)
        wallet = Wallet.objects.get(user=user)
        wallet.shares_owned = """{"1": 3}"""
        future = Future.objects.get(pk=1)
        response = process_order(4, 200, wallet, 'sell', future)
        # We only own 3 but are trying to sell 4.
        self.assertContains(response, 'two separate orders', status_code=400)

    def test_short_sell(self):
        user = User.objects.get(pk=1)
        wallet = Wallet.objects.get(user=user)
        # Want to short-sell "Nigel Richards".
        future = Future.objects.get(pk=1)
        wallet.points = 11000
        wallet.save()
        response = process_order(11, 140, wallet, 'sell', future)
        order = Order.objects.all().order_by('-pk')[0]
        order_1 = Order.objects.get(pk=1)  # Buy 10@155
        self.assertEqual(order_1.filled, True)
        self.assertEqual(order.filled, False)
        self.assertEqual(order.quantity, 1)
        self.assertEqual(order_1.filled_by, user)
        ### Future
        future = Future.objects.get(pk=1)
        self.assertEqual(future.last_buy, 155)
        self.assertEqual(future.ask, 140)
        self.assertEqual(future.bid, None)
        self.assertEqual(future.volume, 10)
        history = FutureHistory.objects.filter(future=future)
        logger.debug(history)
        self.assertEqual(history.count(), 1)
        self.assertEqual(history[0].price, 155)
        transactions = SuccessfulTransaction.objects.filter(future=future)
        self.assertEqual(transactions.count(), 1)
        self.assertTrue(self.compare_transactions(
            transactions[0], SuccessfulTransaction(
                buyer=order_1.creator, seller=user, future=future,
                quantity=10, unit_price=155)))
        # Wallets.
        wallet = Wallet.objects.get(user=user)
        wallet_1 = Wallet.objects.get(user=order_1.creator)
        key = '%s' % future.pk
        self.assertEqual(json.loads(wallet_1.shares_owned)[key], 10)
        self.assertEqual(wallet.points, 11000 + (10 * 155))
        self.assertEqual(wallet_1.points, 10000 - (10 * 155))
        self.assertEqual(wallet.frozen, 11000)

    def test_order_4(self):
        """
            Regular sell.
        """
        user = User.objects.get(pk=1)
        wallet = Wallet.objects.get(user=user)
        wallet.shares_owned = """{"1": 7, "4": 10}"""
        future = Future.objects.get(pk=1)
        response = process_order(4, 150, wallet, 'sell', future)
        # Someone wants to buy 10@155
        order = Order.objects.all().order_by('-pk')[0]
        order_1 = Order.objects.get(pk=1) # Buy 10@155
        self.assertEqual(order_1.filled, False)
        self.assertEqual(order.filled, True)
        self.assertEqual(order_1.quantity, 6)
        self.assertEqual(order.filled_by, order_1.creator)
        future = Future.objects.get(pk=1)
        self.assertEqual(future.last_buy, 155)
        self.assertEqual(future.ask, 600)
        self.assertEqual(future.bid, 155)
        self.assertEqual(future.volume, 4)
        history = FutureHistory.objects.filter(future=future)
        self.assertEqual(history.count(), 1)
        self.assertEqual(history[0].price, 155)
        transactions = SuccessfulTransaction.objects.filter(future=future)
        self.assertEqual(transactions.count(), 1)
        self.assertTrue(self.compare_transactions(
            transactions[0], SuccessfulTransaction(
                buyer=order_1.creator, seller=user, future=future,
                quantity=4, unit_price=155)))
        # Wallets
        wallet = Wallet.objects.get(user=user)
        wallet_1 = Wallet.objects.get(user=order_1.creator)
        key = '%s' % future.pk
        self.assertEqual(json.loads(wallet.shares_owned)[key], 3)
        self.assertEqual(json.loads(wallet_1.shares_owned)[key], 4)
        self.assertEqual(json.loads(wallet.shares_owned)['4'], 10) # Unchanged.
        self.assertEqual(wallet_1.points, 10000 - (4 * 155))
        self.assertEqual(wallet.points, 10000 + (4 * 155))
        self.assertEqual(wallet.frozen, 0)
        self.assertEqual(wallet_1.frozen, 0)

    def test_order_5(self):
        """
            A regular sell to multiple people, with some stock still left over.
        """
        user = User.objects.get(pk=1)
        wallet = Wallet.objects.get(user=user)
        wallet.shares_owned = """{"4": 95, "1": 7}"""
        future = Future.objects.get(pk=4)
        # Sell 93 shares at 95 each.
        response = process_order(93, 95, wallet, 'sell', future)
        # Someone wants to buy 75@100, 15@275
        order = Order.objects.all().order_by('-pk')[0]  # My sell.
        order_1 = Order.objects.get(pk=11)  # 15@275
        order_2 = Order.objects.get(pk=5)   # 75@100
        self.assertEqual(order_1.filled, True)
        self.assertEqual(order_2.filled, True)
        self.assertEqual(order.filled, False)
        self.assertEqual(order.quantity, 3)
        self.assertEqual(order_1.filled_by, user)
        self.assertEqual(order_2.filled_by, user)
        future = Future.objects.get(pk=4)
        self.assertEqual(future.last_buy, 100)
        self.assertEqual(future.ask, 95)  # Lowest sale order, my own
        self.assertEqual(future.bid, None)  # Highest buy order
        self.assertEqual(future.volume, 90)
        # History
        history = FutureHistory.objects.filter(future=future)
        self.assertEqual(history.count(), 2)
        self.assertEqual(history[0].price, 275)
        self.assertEqual(history[1].price, 100)  # Got the highest then lowest.
        transactions = SuccessfulTransaction.objects.filter(future=future)
        self.assertEqual(transactions.count(), 2)
        self.assertTrue(self.compare_transactions(
            transactions[0], SuccessfulTransaction(
                buyer=order_1.creator, seller=user, future=future,
                quantity=15, unit_price=275)))
        self.assertTrue(self.compare_transactions(
            transactions[1], SuccessfulTransaction(
                buyer=order_2.creator, seller=user, future=future,
                quantity=75, unit_price=100)))
        # Wallets
        wallet = Wallet.objects.get(user=user)
        wallet_1 = Wallet.objects.get(user=order_1.creator)
        wallet_2 = Wallet.objects.get(user=order_2.creator)
        key = '%s' % future.pk
        self.assertEqual(json.loads(wallet.shares_owned)[key], 5)
        self.assertEqual(json.loads(wallet_1.shares_owned)[key], 15)
        self.assertEqual(json.loads(wallet_2.shares_owned)[key], 75)
        self.assertEqual(json.loads(wallet.shares_owned)['1'], 7)  # Unchanged.
        self.assertEqual(wallet.points, 10000 + (15 * 275) + (75 * 100))
        self.assertEqual(wallet_1.points, 10000 - (15 * 275))
        self.assertEqual(wallet_2.points, 10000 - (75 * 100))
        self.assertEqual(wallet.frozen, 0)
        self.assertEqual(wallet_1.frozen, 0)
        self.assertEqual(wallet_2.frozen, 0)
