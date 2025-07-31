# Aerolith 2.0: A web-based word game website
# Copyright (C) 2011 Cesar Del Solar
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

# To contact the author, please email delsolar at gmail dot com

"""
Management command to clean expired cache entries from StatsCache.
"""

from django.core.management.base import BaseCommand
from django.utils import timezone

from wordwalls.stats_models import StatsCache


class Command(BaseCommand):
    help = 'Clean expired entries from the statistics cache'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting'
        )

    def handle(self, *args, **options):
        now = timezone.now()
        expired_entries = StatsCache.objects.filter(expires_at__lt=now)
        count = expired_entries.count()
        
        if options['dry_run']:
            self.stdout.write(f'Would delete {count} expired cache entries')
            for entry in expired_entries[:10]:  # Show first 10
                self.stdout.write(f'  - {entry.key} (expired {entry.expires_at})')
            if count > 10:
                self.stdout.write(f'  ... and {count - 10} more')
        else:
            deleted_count, _ = expired_entries.delete()
            self.stdout.write(
                self.style.SUCCESS(f'Successfully deleted {deleted_count} expired cache entries')
            )