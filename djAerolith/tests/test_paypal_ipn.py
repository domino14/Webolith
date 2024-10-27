from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from unittest.mock import patch, MagicMock
from datetime import datetime
from accounts.models import AerolithProfile
from dateutil.relativedelta import relativedelta
from django.core import mail


class PaypalIPNTest(TestCase):
    fixtures = [
        "test/lexica.yaml",
    ]

    @patch("urllib.request.urlopen")
    @patch("django.utils.timezone.now")
    def test_paypal_ipn_membership_renewal(self, mock_timezone_now, mock_urlopen):
        # Set the current time to 10/26/2024
        current_time = timezone.make_aware(datetime(2024, 10, 26))
        mock_timezone_now.return_value = current_time

        # Mock the response from urllib.request.urlopen to return 'VERIFIED'
        mock_urlopen.return_value.__enter__.return_value.read.return_value = b"VERIFIED"

        # Create two users

        # User 1: Not a member
        user1 = User.objects.create_user(
            username="user1", email="user1@example.com", password="password"
        )
        # Retrieve the existing AerolithProfile
        profile1 = AerolithProfile.objects.get(user=user1)
        profile1.member = False
        profile1.membershipExpiry = None  # Ensure no active membership
        profile1.save()

        # User 2: Current member, membership expires on 02/10/2025
        user2 = User.objects.create_user(
            username="user2", email="user2@example.com", password="password"
        )
        # Retrieve the existing AerolithProfile
        profile2 = AerolithProfile.objects.get(user=user2)
        membership_expiry_user2 = timezone.make_aware(datetime(2025, 2, 10, 21, 16, 36))
        profile2.member = True
        profile2.membershipExpiry = membership_expiry_user2
        profile2.membershipType = AerolithProfile.GOLD_MTYPE
        profile2.save()

        # Prepare POST data for user1 (non-member)
        post_data_user1 = {
            "custom": "user1",  # Username passed in the 'custom' field
            "payment_status": "Completed",
            "txn_id": "TESTTXNID1",
        }

        # Send POST request to the paypal_ipn view for user1
        response = self.client.post("/paypal-ipn/", post_data_user1)

        # Check that the response is 200
        self.assertEqual(response.status_code, 200)

        # Reload the profile from the database
        profile1.refresh_from_db()

        # Expected expiry date: one year from now, at 23:59:59
        expected_expiry_user1 = current_time + relativedelta(years=1)
        expected_expiry_user1 = expected_expiry_user1.replace(
            hour=23, minute=59, second=59, microsecond=0
        )

        self.assertEqual(profile1.membershipExpiry, expected_expiry_user1)
        self.assertTrue(profile1.member)
        self.assertEqual(profile1.membershipType, AerolithProfile.GOLD_MTYPE)

        # Prepare POST data for user2 (current member)
        post_data_user2 = {
            "custom": "user2",
            "payment_status": "Completed",
            "txn_id": "TESTTXNID2",
        }

        # Send POST request to the paypal_ipn view for user2
        response = self.client.post("/paypal-ipn/", post_data_user2)

        # Check that the response is 200
        self.assertEqual(response.status_code, 200)

        # Reload the profile from the database
        profile2.refresh_from_db()

        # Expected expiry date: one year from current expiry date, at 23:59:59
        expected_expiry_user2 = membership_expiry_user2 + relativedelta(years=1)
        expected_expiry_user2 = expected_expiry_user2.replace(
            hour=23, minute=59, second=59, microsecond=0
        )

        self.assertEqual(profile2.membershipExpiry, expected_expiry_user2)
        self.assertTrue(profile2.member)
        self.assertEqual(profile2.membershipType, AerolithProfile.GOLD_MTYPE)

        # Check that emails were sent
        self.assertEqual(len(mail.outbox), 2)  # One email per transaction

        # Optionally, check the content of the emails
        self.assertIn("Updated membership for user1", mail.outbox[0].subject)
        self.assertIn("user1 signed up for a plan", mail.outbox[0].body)
        self.assertIn("Updated membership for user2", mail.outbox[1].subject)
        self.assertIn("user2 signed up for a plan", mail.outbox[1].body)
