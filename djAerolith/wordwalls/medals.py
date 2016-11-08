import json
from datetime import date
import logging

from wordwalls.models import (DailyChallengeLeaderboard,
                              DailyChallengeLeaderboardEntry,
                              DailyChallengeName)
from wordwalls.challenges import toughies_challenge_date
logger = logging.getLogger(__name__)


def sort_cmp(e1, e2):
    """ Sort two leaderboard entries by score, then time remaining. """
    if e1.score == e2.score:
        return int(e2.timeRemaining - e1.timeRemaining)
    return int(e2.score - e1.score)
    # Otherwise, randomly award to someone if time and score are the same.
    # It's not necessarily alphabetical, but based on the vagaries of the
    # hash function :P


def award_medals():
    """ Award medals for daily challenges. """
    today = date.today()
    toughies = DailyChallengeName.objects.get(
        name=DailyChallengeName.WEEKS_BINGO_TOUGHIES)
    blankies = DailyChallengeName.objects.get(
        name=DailyChallengeName.BLANK_BINGOS)
    marathons = DailyChallengeName.objects.get(
        name=DailyChallengeName.BINGO_MARATHON)
    lbs = DailyChallengeLeaderboard.objects.filter(
        medalsAwarded=False, challenge__date__lt=today)
    for lb in lbs:
        award = True
        if lb.challenge.name == toughies:
            chDate = toughies_challenge_date(today)
            # Toughies challenge still ongoing
            if chDate == lb.challenge.date:
                award = False

        if not award:
            continue

        lbes = DailyChallengeLeaderboardEntry.objects.filter(
            board=lb, qualifyForAward=True)
        if len(lbes) < 8:
            lb.medalsAwarded = True
            lb.save()
            continue    # do not award
        lbes = sorted(lbes, cmp=sort_cmp)

        if lb.challenge.name == toughies:
            # Award extra medal.
            medals = ['Platinum', 'Gold', 'Silver', 'Bronze']
        elif lb.challenge.name in (blankies, marathons):
            medals = ['GoldStar', 'Gold', 'Silver', 'Bronze']
        else:
            medals = ['Gold', 'Silver', 'Bronze']

        for i in range(len(medals)):
            try:
                lbes[i].additionalData = json.dumps(
                    {'medal': medals[i]})
            except IndexError:
                break
            lbes[i].save()
            profile = lbes[i].user.aerolithprofile
            try:
                userMedals = json.loads(profile.wordwallsMedals)
            except (TypeError, ValueError):
                userMedals = {'medals': {}}
            if 'medals' not in userMedals:
                userMedals = {'medals': {}}
            if medals[i] in userMedals['medals']:
                userMedals['medals'][medals[i]] += 1
            else:
                userMedals['medals'][medals[i]] = 1

            profile.wordwallsMedals = json.dumps(userMedals)
            profile.save()
            logger.debug('%s: %s', profile.user.username,
                         profile.wordwallsMedals)

        logger.debug('awarded medals: %s', lb)
        lb.medalsAwarded = True
        lb.save()
