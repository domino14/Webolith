""" End memberships that have expired. """
from datetime import timedelta
import logging

from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import AerolithProfile

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    def handle(self, *args, **options):
        profiles = AerolithProfile.objects.filter(
            member=True,
            # add a few-day grace period.
            membershipExpiry__lt=(timezone.now() - timedelta(days=3))
        )
        for profile in profiles:
            profile.member = False
            logger.info('Expiring: %s (%s)', profile.user,
                        profile.membershipExpiry)
            profile.save()
