# Awards challenge medals.
import logging
from datetime import date

from django.core.management.base import BaseCommand

from wordwalls.models import (DailyChallengeLeaderboard,
                              DailyChallengeLeaderboardEntry,
                              DailyChallengeName, Medal)
from wordwalls.challenges import toughies_challenge_date
logger = logging.getLogger(__name__)


class Command(BaseCommand):
    def award_medals(self, leaderboard):
        """ Award medals for a given leaderboard. """
        lbes = DailyChallengeLeaderboardEntry.objects.filter(
            board=leaderboard, qualifyForAward=True)
        if len(lbes) < 8:
            leaderboard.medalsAwarded = True   # meh, this is ugly.
            leaderboard.save()
            return  # Do not award medals; too few players.

        lbes = sorted(lbes, cmp=sort_cmp)
        if leaderboard.challenge.name == self.toughies:
            # Award extra medal.
            medals = [Medal.TYPE_PLATINUM, Medal.TYPE_GOLD, Medal.TYPE_SILVER,
                      Medal.TYPE_BRONZE]
        elif leaderboard.challenge.name in (self.blankies, self.marathons):
            medals = [Medal.TYPE_GOLD_STAR, Medal.TYPE_GOLD, Medal.TYPE_SILVER,
                      Medal.TYPE_BRONZE]
        else:
            medals = [Medal.TYPE_GOLD, Medal.TYPE_SILVER, Medal.TYPE_BRONZE]

        for i in range(len(medals)):
            Medal.objects.create(
                user=lbes[i].user,
                leaderboard=lbes[i].board,
                medal_type=medals[i])

        logger.debug('awarded medals for %s', leaderboard)
        leaderboard.medalsAwarded = True
        leaderboard.save()

    def handle(self, *args, **options):
        today = date.today()
        self.toughies = DailyChallengeName.objects.get(
            name=DailyChallengeName.WEEKS_BINGO_TOUGHIES)
        self.blankies = DailyChallengeName.objects.get(
            name=DailyChallengeName.BLANK_BINGOS)
        self.marathons = DailyChallengeName.objects.get(
            name=DailyChallengeName.BINGO_MARATHON)
        lbs = DailyChallengeLeaderboard.objects.filter(
            medalsAwarded=False, challenge__date__lt=today)
        logger.debug('Need to award medals for %s leaderboards', lbs.count())
        for lb in lbs:
            award = True
            if lb.challenge.name == self.toughies:
                chDate = toughies_challenge_date(today)
                # Toughies challenge still ongoing
                if chDate == lb.challenge.date:
                    award = False
                    logger.debug('%s: Toughies still ongoing, do not award.',
                                 lb)
            if not award:
                continue
            self.award_medals(lb)


def sort_cmp(e1, e2):
    if e1.score == e2.score:
        return int(e2.timeRemaining - e1.timeRemaining)
    else:
        return int(e2.score - e1.score)
    # Otherwise, randomly award to someone if time and score are the same.
    # It's not necessarily alphabetical, but based on the vagaries of the
    # hash function :P
