from django.contrib.auth.decorators import login_required
from django.db.models import Case, When, Count, IntegerField
from django.shortcuts import render

from base.models import Lexicon
from lib.response import response
from wordwalls.models import (
    DailyChallengeName,
    DailyChallenge,
    DailyChallengeLeaderboard,
    DailyChallengeLeaderboardEntry,
    Medal,
    User,
)


# If not logged in, will ask user to log in and forward back to the main url
@login_required
def main(request):
    return render(request, "wordwalls/stats.html")


@login_required
def get_stats(request, lexicon, type_of_challenge_id):
    start_date = request.GET.get("start_date")
    end_date = request.GET.get("end_date")

    try:
        lexicon = Lexicon.objects.get(id=lexicon)
    except Lexicon.DoesNotExist:
        return response({"error": "Lexicon not found"}, status=404)

    lexica_map = {
        "american": ["OWL2", "America", "NWL18", "NWL20", "NWL23"],
        "world_english": ["CSW12", "CSW15", "CSW19", "CSW21"],
        "polish": ["OSPS40", "OSPS41", "OSPS42", "OSPS44", "OSPS46", "OSPS48", "OSPS49"],
        "french": ["FRA20", "FRA24"]
    }

    lexica = next((v for k, v in lexica_map.items() if lexicon.lexiconName in v), [lexicon.lexiconName])

    try:
        name = DailyChallengeName.objects.get(id=type_of_challenge_id)
    except DailyChallengeName.DoesNotExist:
        return response({"error": "Challenge name not found"}, status=404)

    challenges = DailyChallenge.objects.filter(
        name=name, lexicon__lexiconName__in=lexica
    )

    if start_date or end_date:
        date_filter = {}
        if start_date:
            date_filter['date__gte'] = start_date
        if end_date:
            date_filter['date__lte'] = end_date
        challenges = challenges.filter(**date_filter)

    leaderboards = DailyChallengeLeaderboard.objects.filter(challenge__in=challenges)
    entries = DailyChallengeLeaderboardEntry.objects.filter(
        user=request.user, board__in=leaderboards
    ).select_related('board__challenge')

    info_we_want = [
        {
            "Score": entry.score,
            "maxScore": entry.board.maxScore,
            "timeRemaining": entry.timeRemaining,
            "Date": entry.board.challenge.date.strftime("%Y-%m-%d")
        }
        for entry in entries
    ]

    return response(info_we_want)


@login_required
def leaderboard(request):
    return render(request, "wordwalls/leaderboard.html")


@login_required
def get_medals(request):
    users_medals_totals = []
    users = (
        User.objects.only("username")
        .annotate(
            num_medals=Count("medal"),
            num_platinum=Count(
                Case(
                    When(medal__medal_type=Medal.TYPE_PLATINUM, then=1),
                    output_field=IntegerField(),
                )
            ),
            num_goldstar=Count(
                Case(
                    When(medal__medal_type=Medal.TYPE_GOLD_STAR, then=1),
                    output_field=IntegerField(),
                )
            ),
            num_gold=Count(
                Case(
                    When(medal__medal_type=Medal.TYPE_GOLD, then=1),
                    output_field=IntegerField(),
                )
            ),
            num_silver=Count(
                Case(
                    When(medal__medal_type=Medal.TYPE_SILVER, then=1),
                    output_field=IntegerField(),
                )
            ),
            num_bronze=Count(
                Case(
                    When(medal__medal_type=Medal.TYPE_BRONZE, then=1),
                    output_field=IntegerField(),
                )
            ),
        )
        .order_by("-num_medals")[:10]
    )

    for user in users:
        user_info = {
            "name": user.username,
            "GoldStar": user.num_goldstar,
            "Bronze": user.num_bronze,
            "Silver": user.num_silver,
            "Gold": user.num_gold,
            "Platinum": user.num_platinum,
            "total": user.num_medals,
        }
        users_medals_totals.append(user_info)

    return response(list(reversed(users_medals_totals)))
