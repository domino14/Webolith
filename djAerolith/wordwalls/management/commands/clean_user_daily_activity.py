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
Management command to clean old UserDailyActivity records.
This keeps the table size manageable while preserving recent data needed for statistics.
"""

import logging
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.conf import settings
import pytz

from wordwalls.stats_models import UserDailyActivity


logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Clean old UserDailyActivity records to keep database lean'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Number of days to keep (default: 30)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting'
        )

    def handle(self, *args, **options):
        days_to_keep = options['days']
        dry_run = options['dry_run']
        
        # Calculate cutoff date in Pacific timezone
        pst = pytz.timezone(settings.TIME_ZONE)  # America/Los_Angeles
        now_pst = timezone.now().astimezone(pst)
        cutoff_date = now_pst.date() - timedelta(days=days_to_keep)
        
        self.stdout.write(f'Cleaning UserDailyActivity records older than {cutoff_date}')
        self.stdout.write(f'Keeping last {days_to_keep} days of data')
        
        # Find records to delete
        old_records = UserDailyActivity.objects.filter(date__lt=cutoff_date)
        count = old_records.count()
        
        if count == 0:
            self.stdout.write(self.style.SUCCESS('No old records found to clean'))
            return
        
        if dry_run:
            self.stdout.write(f'DRY RUN: Would delete {count} UserDailyActivity records')
            
            # Show some sample records that would be deleted
            sample_records = old_records.select_related('user')[:10]
            self.stdout.write('Sample records that would be deleted:')
            for record in sample_records:
                self.stdout.write(
                    f'  - {record.user.username}: {record.date} '
                    f'({record.quiz_count} quizzes, {record.words_solved_count} words)'
                )
            if count > 10:
                self.stdout.write(f'  ... and {count - 10} more records')
        else:
            # Delete the records
            with transaction.atomic():
                deleted_count, deleted_details = old_records.delete()
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Successfully deleted {deleted_count} old UserDailyActivity records'
                    )
                )
                
                # Log the deletion details
                if deleted_details:
                    for model, count in deleted_details.items():
                        if count > 0:
                            self.stdout.write(f'  - {model}: {count} records')
                
                # Log some stats about what remains
                remaining_count = UserDailyActivity.objects.count()
                self.stdout.write(f'Remaining UserDailyActivity records: {remaining_count}')
                
                if remaining_count > 0:
                    oldest_remaining = UserDailyActivity.objects.order_by('date').first()
                    newest_remaining = UserDailyActivity.objects.order_by('-date').first()
                    
                    if oldest_remaining and newest_remaining:
                        self.stdout.write(
                            f'Date range of remaining records: {oldest_remaining.date} to {newest_remaining.date}'
                        )