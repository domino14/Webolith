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

import logging
from datetime import datetime, timedelta, date
from typing import Dict, List, Optional

from django.utils import timezone
from django.db import transaction
from django.db.models import Count, Sum, Q
from django.conf import settings
import pytz

from wordwalls.stats_models import DailyStats, StatsCache, UserDailyActivity
from base.models import WordList


logger = logging.getLogger(__name__)


class StatsService:
    """Service for managing wordwalls statistics."""
    
    @staticmethod
    def _get_pst_today() -> date:
        """Get today's date in Pacific timezone."""
        pst = pytz.timezone(settings.TIME_ZONE)  # America/Los_Angeles
        now_pst = timezone.now().astimezone(pst)
        return now_pst.date()
    
    @staticmethod
    def _get_pst_date_range(days: int) -> tuple[date, date]:
        """Get date range in PST for the last N days."""
        end_date = StatsService._get_pst_today()
        start_date = end_date - timedelta(days=days-1)
        return start_date, end_date
    
    @classmethod
    def update_quiz_started(cls, user) -> None:
        """
        Called when a quiz is started. Updates daily statistics.
        
        Args:
            user: The user who started the quiz
        """
        if not user or not user.is_authenticated:
            return
            
        today = cls._get_pst_today()
        
        with transaction.atomic():
            # Update or create user daily activity
            user_activity, created = UserDailyActivity.objects.get_or_create(
                user=user,
                date=today,
                defaults={'quiz_count': 1}
            )
            if not created:
                user_activity.quiz_count += 1
                user_activity.save()
            
            # Update or create daily stats
            daily_stats, created = DailyStats.objects.get_or_create(
                date=today,
                defaults={
                    'unique_users_count': 1,
                    'quizzes_started_count': 1,
                    'words_solved_count': 0
                }
            )
            if not created:
                # If this is the user's first quiz today, increment unique users
                if user_activity.quiz_count == 1:
                    daily_stats.unique_users_count += 1
                daily_stats.quizzes_started_count += 1
                daily_stats.save()
    
    @classmethod
    def update_word_solved(cls, user) -> None:
        """
        Called when a word is solved. Updates daily statistics.
        
        Args:
            user: The user who solved the word
        """
        if not user or not user.is_authenticated:
            return
            
        today = cls._get_pst_today()
        
        with transaction.atomic():
            # Update user daily activity
            user_activity, created = UserDailyActivity.objects.get_or_create(
                user=user,
                date=today,
                defaults={'words_solved_count': 1}
            )
            if not created:
                user_activity.words_solved_count += 1
                user_activity.save()
            
            # Update daily stats
            daily_stats, created = DailyStats.objects.get_or_create(
                date=today,
                defaults={
                    'unique_users_count': 1 if created else 0,
                    'quizzes_started_count': 0,
                    'words_solved_count': 1
                }
            )
            if not created:
                daily_stats.words_solved_count += 1
                daily_stats.save()
    
    @classmethod
    def get_daily_stats(cls, target_date: date) -> Dict:
        """
        Get statistics for a specific date.
        
        Args:
            target_date: The date to get stats for
            
        Returns:
            Dictionary with statistics
        """
        try:
            stats = DailyStats.objects.get(date=target_date)
            return {
                'date': stats.date.isoformat(),
                'unique_users': stats.unique_users_count,
                'quizzes_started': stats.quizzes_started_count,
                'words_solved': stats.words_solved_count,
            }
        except DailyStats.DoesNotExist:
            return {
                'date': target_date.isoformat(),
                'unique_users': 0,
                'quizzes_started': 0,
                'words_solved': 0,
            }
    
    @classmethod
    def get_today_stats(cls) -> Dict:
        """Get today's statistics."""
        return cls.get_daily_stats(cls._get_pst_today())
    
    @classmethod
    def get_weekly_stats(cls) -> Dict:
        """Get statistics for the last 7 days."""
        start_date, end_date = cls._get_pst_date_range(7)
        
        # Get all stats in date range
        daily_stats = DailyStats.objects.filter(
            date__gte=start_date,
            date__lte=end_date
        ).order_by('date')
        
        # Build stats by date
        stats_by_date = {stat.date: stat for stat in daily_stats}
        
        # Build result for all 7 days
        result = []
        current_date = start_date
        while current_date <= end_date:
            if current_date in stats_by_date:
                stat = stats_by_date[current_date]
                result.append({
                    'date': current_date.isoformat(),
                    'unique_users': stat.unique_users_count,
                    'quizzes_started': stat.quizzes_started_count,
                    'words_solved': stat.words_solved_count,
                })
            else:
                result.append({
                    'date': current_date.isoformat(),
                    'unique_users': 0,
                    'quizzes_started': 0,
                    'words_solved': 0,
                })
            current_date += timedelta(days=1)
        
        # Calculate totals
        total_unique_users = UserDailyActivity.objects.filter(
            date__gte=start_date,
            date__lte=end_date
        ).values('user').distinct().count()
        
        total_quizzes = sum(day['quizzes_started'] for day in result)
        total_words = sum(day['words_solved'] for day in result)
        
        return {
            'daily_stats': result,
            'totals': {
                'unique_users': total_unique_users,
                'quizzes_started': total_quizzes,
                'words_solved': total_words,
            }
        }
    
    @classmethod
    def get_total_saved_lists(cls) -> int:
        """Get total number of saved word lists (non-temporary)."""
        # Check cache first
        cache_key = 'total_saved_lists'
        
        try:
            cache_entry = StatsCache.objects.get(key=cache_key)
            if not cache_entry.is_expired:
                return cache_entry.value['count']
            else:
                # Delete expired entry
                cache_entry.delete()
        except StatsCache.DoesNotExist:
            pass
        
        # Calculate and cache
        count = WordList.objects.filter(is_temporary=False).count()
        
        # Cache for 1 hour
        expires_at = timezone.now() + timedelta(hours=1)
        StatsCache.objects.update_or_create(
            key=cache_key,
            defaults={
                'value': {'count': count},
                'expires_at': expires_at
            }
        )
        
        return count
    
    @classmethod
    def get_stats_summary(cls) -> Dict:
        """Get a summary of all statistics."""
        today_stats = cls.get_today_stats()
        weekly_stats = cls.get_weekly_stats()
        total_lists = cls.get_total_saved_lists()
        
        return {
            'today': today_stats,
            'week': weekly_stats,
            'total_saved_lists': total_lists,
            'timezone': settings.TIME_ZONE,
        }
    
    @classmethod
    def clean_expired_cache(cls) -> int:
        """
        Clean expired cache entries and return count of deleted entries.
        This can be called periodically or from management commands.
        """
        from wordwalls.stats_models import StatsCache
        
        expired_entries = StatsCache.objects.filter(expires_at__lt=timezone.now())
        count, _ = expired_entries.delete()
        return count