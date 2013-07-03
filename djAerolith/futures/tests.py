"""
This file demonstrates writing tests using the unittest module. These will pass
when you run "manage.py test".

Replace this with more appropriate tests for your application.
"""

from django.test import TestCase
from futures.views import process_order
from futures.models import Order, Future, Wallet
from django.contrib.auth.models import User


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

    def test_order_1(self):
        user = User.objects.get(pk=8)
        wallet = Wallet.objects.get(user=user)
        # Want to buy future "Jesse Day".
        # There is a sell order of 8 for 600, a buy order of 4 for 100,
        # a sell order of 4 for 325, a buy order of 4 for 275 in the fixture.
        future = Future.objects.get(pk=4)
        response = process_order(15, 650, wallet, 'buy', future)
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
