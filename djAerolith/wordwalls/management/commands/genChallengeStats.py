# # generate challenge stats
# from django.core.management.base import BaseCommand, CommandError
# from wordwalls.models import (DailyChallenge,
#                                 DailyChallengeLeaderboard,
#                                 DailyChallengeLeaderboardEntry)

# from django.conf import settings
# from datetime import datetime, timedelta, date

# class Command(BaseCommand):
#     def handle(self, *args, **options):
#         frombeginning = False
#         if len(args) == 1:
#             if args[0] == 'frombeginning':
#                 frombeginning = True
#         yesterday = date.today() - timedelta(days=1)
#         r = redis.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, db=1)
#         if frombeginning:
#             dcs = DailyChallenge.objects.all()
#         else:
#             dcs = DailyChallenge.objects.filter(date=)
#         for dc in dcs:
#             numObjs = len(dcs)
#             if numObjs > 0:
#                 for dc in dcs:
#                     dc.delete()
