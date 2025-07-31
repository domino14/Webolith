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

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class DailyStats(models.Model):
    """
    Model to store daily aggregated statistics for the wordwalls app.
    This helps avoid expensive queries on large tables.
    """
    date = models.DateField(unique=True, db_index=True)
    unique_users_count = models.IntegerField(default=0)
    quizzes_started_count = models.IntegerField(default=0)
    words_solved_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Daily Statistics"
        verbose_name_plural = "Daily Statistics"
        ordering = ["-date"]

    def __str__(self):
        return f"Stats for {self.date}: {self.unique_users_count} users, {self.quizzes_started_count} quizzes"


class StatsCache(models.Model):
    """
    General purpose cache for statistics that don't fit the daily model.
    Uses key-value storage with expiration.
    """
    key = models.CharField(max_length=128, unique=True, db_index=True)
    value = models.JSONField()
    expires_at = models.DateTimeField(db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Statistics Cache"
        verbose_name_plural = "Statistics Caches"

    def __str__(self):
        return f"Cache: {self.key}"

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at


class UserDailyActivity(models.Model):
    """
    Track daily activity per user to help with unique user counts.
    This is a helper model to efficiently track unique users per day.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateField(db_index=True)
    quiz_count = models.IntegerField(default=0)
    words_solved_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "date")
        indexes = [
            models.Index(fields=["date", "user"]),
        ]

    def __str__(self):
        return f"{self.user.username} activity on {self.date}"