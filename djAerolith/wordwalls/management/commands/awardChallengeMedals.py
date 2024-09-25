# Awards challenge medals.
import logging
from operator import attrgetter

from django.core.management.base import BaseCommand
from django.utils import timezone

from wordwalls.models import (
    DailyChallengeLeaderboard,
    DailyChallengeLeaderboardEntry,
    DailyChallengeName,
    Medal,
)
from wordwalls.challenges import toughies_challenge_date

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    def add_arguments(self, parser):
        # Named (optional) arguments
        parser.add_argument(
            "--dry-run",
            action="store_true",
            dest="dry-run",
            default=False,
            help="Do not award medals; do a dry run instead.",
        )

    def award_medals(self, leaderboard, dryrun):
        """Award medals for a given leaderboard."""
        lbes = DailyChallengeLeaderboardEntry.objects.filter(
            board=leaderboard, qualifyForAward=True
        )

        if len(lbes) < 8:
            logger.debug("Entries for %s are %s, do not award", leaderboard, len(lbes))
            leaderboard.medalsAwarded = True  # meh, this is ugly.
            if not dryrun:
                leaderboard.save()
            else:
                logger.debug("Dry run, not saving leaderboard.")
            return  # Do not award medals; too few players.

        lbes = sorted(
            lbes,
            key=lambda item: (-item.score, item.wrong_answers, -item.timeRemaining),
        )
        if leaderboard.challenge.name == self.toughies:
            # Award extra medal.
            medals = [
                Medal.TYPE_PLATINUM,
                Medal.TYPE_GOLD,
                Medal.TYPE_SILVER,
                Medal.TYPE_BRONZE,
            ]
        elif leaderboard.challenge.name in (self.blankies, self.marathons):
            medals = [
                Medal.TYPE_GOLD_STAR,
                Medal.TYPE_GOLD,
                Medal.TYPE_SILVER,
                Medal.TYPE_BRONZE,
            ]
        else:
            medals = [Medal.TYPE_GOLD, Medal.TYPE_SILVER, Medal.TYPE_BRONZE]

        for i in range(len(medals)):
            Medal.objects.create(
                user=lbes[i].user, leaderboard=lbes[i].board, medal_type=medals[i]
            )

        logger.debug("awarded medals for %s", leaderboard)
        leaderboard.medalsAwarded = True
        if not dryrun:
            leaderboard.save()
        else:
            logger.debug("Dry run, not saving leaderboard.")

    def handle(self, *args, **options):
        today = timezone.localtime(timezone.now()).date()
        logger.debug("Today is %s", today)
        self.toughies = DailyChallengeName.objects.get(
            name=DailyChallengeName.WEEKS_BINGO_TOUGHIES
        )
        self.blankies = DailyChallengeName.objects.get(
            name=DailyChallengeName.BLANK_BINGOS
        )
        self.marathons = DailyChallengeName.objects.get(
            name=DailyChallengeName.BINGO_MARATHON
        )
        lbs = DailyChallengeLeaderboard.objects.filter(
            medalsAwarded=False, challenge__date__lt=today
        )
        logger.debug("Need to award medals for %s leaderboards", lbs.count())
        for lb in lbs:
            award = True
            if lb.challenge.name == self.toughies:
                ch_date = toughies_challenge_date(today)
                # Toughies challenge still ongoing
                if ch_date == lb.challenge.date:
                    award = False
                    logger.debug("%s: Toughies still ongoing, do not award.", lb)
            if not award:
                continue
            self.award_medals(lb, options["dry-run"])
