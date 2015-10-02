from django.core.management.base import BaseCommand, CommandError
from wordwalls.models import (DailyChallenge,
                                DailyChallengeName,
                                DailyChallengeMissedBingos,
                                DailyChallengeLeaderboard,
                                DailyChallengeLeaderboardEntry)
from datetime import date, timedelta
from base.models import Lexicon, Alphagram, alphProbToProbPK
import random
import time


class Command(BaseCommand):
    help = """Fetch tough bingos from the history of all bingos ever queried.
        Alternatively, fetch questions that have never been asked."""

    def handle(self, *args, **options):
        if len(args) != 5:
            raise CommandError("Args: lexicon_name min_prob max_prob length "
                               "mode where mode is missed or unasked")
        lexicon = Lexicon.objects.get(lexiconName=args[0])
        length = int(args[3])
        min_prob = int(args[1])
        max_prob = int(args[2])
        min_pk = alphProbToProbPK(min_prob, lexicon.pk, length)
        max_pk = alphProbToProbPK(max_prob, lexicon.pk, length)
        # Get all alphagrams between these probabilities.
        alphagrams = Alphagram.objects.filter(probability_pk__gte=min_pk,
                                              probability_pk__lte=max_pk)
