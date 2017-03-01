"""

Migrate to the new medals model. This should be a two-part
migration.

"""
import json

from django.core.management.base import BaseCommand

from wordwalls.models import DailyChallengeLeaderboardEntry, Medal
from accounts.models import AerolithProfile


def convert_to_medal_type(old_medal_name):
    """ Convert the old_medal_name stored in additionalData to a new type. """
    return {
        'Platinum': Medal.TYPE_PLATINUM,
        'Gold': Medal.TYPE_GOLD,
        'Silver': Medal.TYPE_SILVER,
        'GoldStar': Medal.TYPE_GOLD_STAR,
        'Bronze': Medal.TYPE_BRONZE
    }[old_medal_name]


def convert_from_medal_type(medal_type):
    """ The inverse of the above function. """
    return {
        Medal.TYPE_PLATINUM: 'Platinum',
        Medal.TYPE_GOLD: 'Gold',
        Medal.TYPE_SILVER: 'Silver',
        Medal.TYPE_GOLD_STAR: 'GoldStar',
        Medal.TYPE_BRONZE: 'Bronze',
    }[medal_type]


class Command(BaseCommand):
    all_medals = [Medal.TYPE_BRONZE, Medal.TYPE_SILVER, Medal.TYPE_GOLD,
                  Medal.TYPE_GOLD_STAR, Medal.TYPE_PLATINUM]

    def verify_counts(self):
        # Verify that counts match.
        profiles = AerolithProfile.objects.all()
        for profile in profiles:
            try:
                medals = json.loads(profile.wordwallsMedals)
            except (TypeError, ValueError):
                # No medals.
                continue
            medals = medals.get('medals', {})
            if not medals:
                continue
            # Verify for each medal type.
            for medal_type in self.all_medals:
                num_medals_model = Medal.objects.filter(
                    lb_entry__user=profile.user,
                    medal_type=medal_type).count()
                num_medals_profile = medals.get(
                    convert_from_medal_type(medal_type), 0)
                if num_medals_model != num_medals_profile:
                    print (
                        'Mismatch! User {0} has {1} {2} medals in profile '
                        'and {3} {2} medals in Medal model'.format(
                            profile.user, num_medals_profile, medal_type,
                            num_medals_model))

    def migrate(self):
        entries = DailyChallengeLeaderboardEntry.objects.exclude(
            additionalData__isnull=True)
        print 'Migrating {0} medals'.format(entries.count())

        for idx, entry in enumerate(entries):
            if idx % 1000 == 0:
                print idx, '...'
            addl_data = json.loads(entry.additionalData)
            # Make this idempotent
            medal, created = Medal.objects.get_or_create(
                lb_entry=entry,
                medal_type=convert_to_medal_type(addl_data['medal'])
            )
        print idx

    def handle(self, *args, **options):
        # Get only medal entries.
        self.migrate()
        self.verify_counts()

        print 'Done!'
