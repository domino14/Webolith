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
Management command to rebuild historical statistics from existing data.
This is useful for initial population of the stats tables.
"""

import logging
from datetime import datetime, timedelta, date
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.models import Count, Q
from django.utils import timezone
import pytz

from wordwalls.models import WordwallsGameModel
from wordwalls.stats_models import DailyStats, UserDailyActivity
from django.conf import settings


logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Rebuild historical statistics from WordwallsGameModel data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Number of days to rebuild stats for (default: 30)'
        )
        parser.add_argument(
            '--start-date',
            type=str,
            help='Start date in YYYY-MM-DD format (overrides --days)'
        )
        parser.add_argument(
            '--end-date',
            type=str,
            help='End date in YYYY-MM-DD format (default: today)'
        )

    def handle(self, *args, **options):
        pst = pytz.timezone(settings.TIME_ZONE)
        
        # Determine date range
        if options['start_date']:
            try:
                start_date = datetime.strptime(options['start_date'], '%Y-%m-%d').date()
            except ValueError:
                raise CommandError('Invalid start date format. Use YYYY-MM-DD')
        else:
            days = options['days']
            start_date = timezone.now().astimezone(pst).date() - timedelta(days=days-1)
        
        if options['end_date']:
            try:
                end_date = datetime.strptime(options['end_date'], '%Y-%m-%d').date()
            except ValueError:
                raise CommandError('Invalid end date format. Use YYYY-MM-DD')
        else:
            end_date = timezone.now().astimezone(pst).date()
        
        if start_date > end_date:
            raise CommandError('Start date must be before or equal to end date')
        
        self.stdout.write(f'Rebuilding stats from {start_date} to {end_date}...')
        
        current_date = start_date
        total_days = (end_date - start_date).days + 1
        processed = 0
        
        while current_date <= end_date:
            self.rebuild_stats_for_date(current_date, pst)
            processed += 1
            self.stdout.write(f'Progress: {processed}/{total_days} days processed')
            current_date += timedelta(days=1)
        
        self.stdout.write(self.style.SUCCESS(f'Successfully rebuilt stats for {total_days} days'))

    def rebuild_stats_for_date(self, target_date: date, pst):
        """Rebuild statistics for a specific date."""
        # Convert date to timezone-aware datetime range
        start_datetime = pst.localize(datetime.combine(target_date, datetime.min.time()))
        end_datetime = start_datetime + timedelta(days=1)
        
        # Convert to UTC for database queries
        start_utc = start_datetime.astimezone(pytz.UTC)
        end_utc = end_datetime.astimezone(pytz.UTC)
        
        with transaction.atomic():
            # Get all game models that were saved on this date
            games = WordwallsGameModel.objects.filter(
                lastSaved__gte=start_utc,
                lastSaved__lt=end_utc
            ).select_related('host')
            
            # Track unique users and their activity
            user_stats = {}
            
            for game in games:
                if not game.host:
                    continue
                    
                user = game.host
                if user.id not in user_stats:
                    user_stats[user.id] = {
                        'user': user,
                        'quiz_count': 0,
                        'words_solved': 0
                    }
                
                # Count this as a quiz start
                user_stats[user.id]['quiz_count'] += 1
                
                # Try to parse game state to count solved words
                try:
                    import json
                    state = json.loads(game.currentGameState)
                    # Count solved words based on difference between original and current answer hash
                    original_answers = len(state.get('originalAnswerHash', {}))
                    current_answers = len(state.get('answerHash', {}))
                    words_solved = original_answers - current_answers
                    if words_solved > 0:
                        user_stats[user.id]['words_solved'] += words_solved
                except (json.JSONDecodeError, KeyError):
                    # If we can't parse the state, skip word counting
                    pass
            
            # Create/update UserDailyActivity records
            for user_data in user_stats.values():
                UserDailyActivity.objects.update_or_create(
                    user=user_data['user'],
                    date=target_date,
                    defaults={
                        'quiz_count': user_data['quiz_count'],
                        'words_solved_count': user_data['words_solved']
                    }
                )
            
            # Create/update DailyStats
            total_quizzes = sum(u['quiz_count'] for u in user_stats.values())
            total_words = sum(u['words_solved'] for u in user_stats.values())
            unique_users = len(user_stats)
            
            DailyStats.objects.update_or_create(
                date=target_date,
                defaults={
                    'unique_users_count': unique_users,
                    'quizzes_started_count': total_quizzes,
                    'words_solved_count': total_words
                }
            )
            
            self.stdout.write(
                f'{target_date}: {unique_users} users, {total_quizzes} quizzes, {total_words} words'
            )