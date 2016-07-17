from django.http import HttpResponse
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from wordwalls.models import (DailyChallengeName,
                              DailyChallenge,
                              DailyChallengeLeaderboard,
                              DailyChallengeLeaderboardEntry)
from base.models import Lexicon
import json
from datetime import date


# If not logged in, will ask user to log in and forward back to the main url
@login_required
def main(request):
    return render(request, 'wordwalls/stats.html')


@login_required
def get_stats(request, lexicon, type_of_challenge_id):
    lexicon = Lexicon.objects.get(id=lexicon)
    if lexicon.lexiconName in ('OWL2', 'America'):
        lexica = ['OWL2', 'America']
    elif lexicon.lexiconName in ('CSW12', 'CSW15'):
        lexica = ['CSW12', 'CSW15']
    else:
        lexica = [lexicon.lexiconName]

    name = DailyChallengeName.objects.get(id=type_of_challenge_id)
    challenges = DailyChallenge.objects.filter(name=name, lexicon__lexiconName__in=lexica)
    leaderboards = DailyChallengeLeaderboard.objects.filter(challenge__in=challenges)
    entries = DailyChallengeLeaderboardEntry.objects.filter(user=request.user, board__in=leaderboards)
    print entries

    info_we_want = []

    for entry in entries:
        entry_info = {}
        entry_info['Score'] = entry.score
        entry_info['maxScore'] = entry.board.maxScore
        entry_info['timeRemaining'] = entry.timeRemaining
        entry_info['Date'] = entry.board.challenge.date.strftime('%Y-%m-%d')
        info_we_want.append(entry_info)

    return HttpResponse(json.dumps(info_we_want))
