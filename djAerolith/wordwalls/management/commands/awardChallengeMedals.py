# cleans up DailyChallenges that are older than specified number of days in the past

from django.core.management.base import BaseCommand, CommandError
from wordwalls.models import (DailyChallenge, 
                                DailyChallengeLeaderboard, 
                                DailyChallengeLeaderboardEntry, 
                                DailyChallengeName)
from datetime import datetime, timedelta, date
from wordwalls.management.commands.genMissedBingoChalls import challengeDateFromReqDate
import json

class Command(BaseCommand):
    def handle(self, *args, **options):
        today = date.today()
        toughies = DailyChallengeName.objects.get(name=DailyChallengeName.WEEKS_BINGO_TOUGHIES)
        lbs = DailyChallengeLeaderboard.objects.filter(medalsAwarded=False, challenge__date__lt=today)
        for lb in lbs:
            award = True
            if lb.challenge.name == toughies:
                chDate = challengeDateFromReqDate(today)    
                if chDate == lb.challenge.date: # toughies challenge still ongoing
                    award = False
            if award:
                lbes = DailyChallengeLeaderboardEntry.objects.filter(board=lb, qualifyForAward=True)
                if len(lbes) < 12:
                    lb.medalsAwarded = True
                    lb.save()
                    continue    # do not award
                lbes = sorted(lbes, cmp=sortCmp)

                if lb.challenge.name == toughies or lb.challenge.name = "Today's Bingo Marathon":
                    # award extra medal
                    medals = ['Platinum', 'Gold', 'Silver', 'Bronze']
                else:
                    medals = ['Gold', 'Silver', 'Bronze']
                
                for i in range(len(medals)):
                    lbes[i].additionalData = json.dumps({'medal': medals[i]})
                    lbes[i].save()
                    profile = lbes[i].user.get_profile()
                    try:
                        userMedals = json.loads(profile.wordwallsMedals)
                    except TypeError:
                        userMedals = {'medals': {}}
                    if medals[i] in userMedals['medals']:
                        userMedals['medals'][medals[i]] += 1
                    else:
                        userMedals['medals'][medals[i]] = 1

                    profile.wordwallsMedals = json.dumps(userMedals)
                    profile.save()
                    print profile.user.username, profile.wordwallsMedals
            
                print 'awarded medals', lb
                lb.medalsAwarded = True
                lb.save()

def sortCmp(e1, e2):
    if e1.score == e2.score:
        return int(e2.timeRemaining - e1.timeRemaining)
    else:
        return int(e2.score - e1.score)
