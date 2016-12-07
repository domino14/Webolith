import json
from datetime import date, datetime
import logging

from django.contrib.auth.decorators import login_required
from django.core.exceptions import ObjectDoesNotExist

from wordwalls.models import (
    DailyChallengeName, DailyChallenge, DailyChallengeLeaderboardEntry)
from base.models import Lexicon
from lib.response import response, StatusCode
from wordwalls.views import getLeaderboardData
from wordwalls.challenges import toughies_challenge_date

logger = logging.getLogger(__name__)


def configure(request):
    if request.method != "POST":
        return response("Must use POST.", StatusCode.FORBIDDEN)
    # XXX: User can put any old JSON here. We should do some backend
    # validation.
    prefs = json.loads(request.body)

    profile = request.user.aerolithprofile
    profile.customWordwallsStyle = json.dumps(prefs)
    profile.save()
    return response("OK")


# API Views. No Auth required.
def api_challengers(request):
    if request.method != 'GET':
        return response('Must use GET.', StatusCode.BAD_REQUEST)
    lex = request.GET.get('lexicon')
    ch_id = request.GET.get('challenge')
    ch_date = date_from_request(request)

    return response(challengers(ch_date, lex, ch_id))


## Other API views with required auth.

@login_required
def challenges_played(request):
    """ Get the challenges for the given day, played by the logged-in user. """
    if request.method != 'GET':
        return response('Must use GET.', StatusCode.BAD_REQUEST)
    lex = request.GET.get('lexicon')
    ch_date = date_from_request(request)
    try:
        lex = Lexicon.objects.get(pk=lex)
    except Lexicon.DoesNotExist:
        return response('Bad lexicon.', StatusCode.BAD_REQUEST)

    challenges = DailyChallenge.objects.filter(date=ch_date, lexicon=lex)
    entries = DailyChallengeLeaderboardEntry.objects.filter(
        board__challenge__in=challenges, user=request.user)

    resp = []
    for entry in entries:
        resp.append({'challengeID': entry.board.challenge.name.pk})
    # Search for toughies challenge as well.
    toughies_date = toughies_challenge_date(ch_date)
    try:
        relevant_toughie = DailyChallenge.objects.get(
            date=toughies_date, lexicon=lex,
            name__name=DailyChallengeName.WEEKS_BINGO_TOUGHIES)
    except DailyChallenge.DoesNotExist:
        return response(resp)
    # If the toughies date is not the date in question, we need to see if
    # the user has an entry for this challenge.
    if toughies_date != ch_date:
        try:
            entry = DailyChallengeLeaderboardEntry.objects.get(
                board__challenge=relevant_toughie, user=request.user)
        except DailyChallengeLeaderboardEntry.DoesNotExist:
            return response(resp)

    resp.append({'challengeID': entry.board.challenge.name.pk})
    return response(resp)


# api views helpers
def date_from_request(request):
    """ Get the date from the given GET request. """
    # YYYY-mm-dd
    dt = request.GET.get('date')
    try:
        ch_date = datetime.strptime(dt, '%Y-%m-%d').date()
    except (ValueError, TypeError):
        ch_date = date.today()

    return ch_date


def challengers(dt, lex, ch_id):
    try:
        lex = Lexicon.objects.get(pk=lex)
        ch_name = DailyChallengeName.objects.get(pk=ch_id)
    except ObjectDoesNotExist:
        return response('Bad lexicon or challenge.', StatusCode.BAD_REQUEST)

    return getLeaderboardData(lex, ch_name, dt)
