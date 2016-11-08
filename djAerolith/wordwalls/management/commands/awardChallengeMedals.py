# Awards medals for daily challenges.

from django.core.management.base import BaseCommand
from wordwalls.medals import award_medals


class Command(BaseCommand):
    def handle(self, *args, **options):
        award_medals()
