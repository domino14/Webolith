from django.http import HttpResponse
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from wordwalls.models import (DailyChallengeName,
                              DailyChallenge,
                              DailyChallengeLeaderboard,
                              DailyChallengeLeaderboardEntry)
from accounts.models import AerolithProfile
from base.models import Lexicon
import json
from lib.response import response


# If not logged in, will ask user to log in and forward back to the main url
@login_required
def main(request):

    return render(request, 'wordwalls/stats.html')


@login_required
def get_stats(request, lexicon, type_of_challenge_id):

    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    lexicon = Lexicon.objects.get(id=lexicon)

    if lexicon.lexiconName in ('OWL2', 'America'):
        lexica = ['OWL2', 'America']
    elif lexicon.lexiconName in ('CSW12', 'CSW15'):
        lexica = ['CSW12', 'CSW15']
    else:
        lexica = [lexicon.lexiconName]

    name = DailyChallengeName.objects.get(id=type_of_challenge_id)
    challenges = DailyChallenge.objects.filter(name=name,
                                               lexicon__lexiconName__in=lexica)

    if not start_date and not end_date:
        pass

    elif not start_date:
        challenges = challenges.filter(date__lte=end_date)

    elif not end_date:
        challenges = challenges.filter(date__gte=start_date)

    else:
        challenges = challenges.filter(date__range=(start_date, end_date))

    leaderboards = DailyChallengeLeaderboard.objects.filter(challenge__in=challenges)
    entries = DailyChallengeLeaderboardEntry.objects.filter(user=request.user,
                                                            board__in=leaderboards)

    info_we_want = []

    for entry in entries:
        entry_info = {}
        entry_info['Score'] = entry.score
        entry_info['maxScore'] = entry.board.maxScore
        entry_info['timeRemaining'] = entry.timeRemaining
        entry_info['Date'] = entry.board.challenge.date.strftime('%Y-%m-%d')
        info_we_want.append(entry_info)

    return response(info_we_want)


@login_required
def leaderboard(request):

    return render(request, 'wordwalls/leaderboard.html')


@login_required
def get_medals(request):

    profiles = AerolithProfile.objects.all()

    # {user, dict of medals}
    all_medals = []

    # {user: sum of their medals}
    medal_totals = {}

    ########################################################

    def add_medals(user):
        """ Sum user's medals """

        # Access the dict of medals
        medals_dict = user[1]
        medals = medals_dict["medals"]

        # Convert medal numbers to integers
        for key in medals:
            medals[key] = int(medals[key])

        # Sum medal values
        medals_total = sum(medals.values())

        return medals_total

    ########################################################

    # Weed out users with no medals
    for profile in profiles:

        medals = None

        user = profile.user.username
        if profile.wordwallsMedals is not None and profile.wordwallsMedals != "":
            medals = json.loads(profile.wordwallsMedals)
            if len(medals) < 1:
                continue
        else:
            continue

        user_medals = [user, medals]
        all_medals.append(user_medals)

    # Sum a user's medals, then add the user: total medals key value pair
    # to medal_totals
    for user in all_medals:
        total_medals = add_medals(user)
        medal_totals[user[0]] = total_medals

    return response(medal_totals)
