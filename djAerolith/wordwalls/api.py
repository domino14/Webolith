import json
from datetime import date, datetime
import logging

from django.contrib.auth.decorators import login_required
from django.core.exceptions import ObjectDoesNotExist
from django.views.decorators.http import require_GET, require_POST

from wordwalls.models import (
    DailyChallengeName, DailyChallenge, DailyChallengeLeaderboardEntry,
    WordwallsGameModel)
from base.models import Lexicon
from lib.response import response, StatusCode
from wordwalls.views import getLeaderboardData
from wordwalls.challenges import toughies_challenge_date
from wordwalls.game import WordwallsGame

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
    ch_date = date_from_request_dict(request.GET)

    return response(challengers(ch_date, lex, ch_id))


## Other API views with required auth.

@login_required
@require_GET
def challenges_played(request):
    """ Get the challenges for the given day, played by the logged-in user. """

    lex = request.GET.get('lexicon')
    ch_date = date_from_request_dict(request.GET)
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


@login_required
@require_POST
def new_challenge(request):
    """
    Load a new challenge into this table.

    """
    body = json.loads(request.body)
    # First verify that the user has access to this table.
    # XXX Later: assign a table num if not provided, etc.
    if not access_to_table(body['tablenum'], request.user):
        return response('User is not in this table.', StatusCode.BAD_REQUEST)

    dt = date_from_request_dict(body)
    lex = body['lexicon']
    ch_id = body['challenge']
    # Load or create new challenge.
    try:
        lex = Lexicon.objects.get(pk=lex)
    except Lexicon.DoesNotExist:
        return response('Bad lexicon.', StatusCode.BAD_REQUEST)
    try:
        challenge_name = DailyChallengeName.objects.get(pk=ch_id)
    except DailyChallengeName.DoesNotExist:
        return response('Bad challenge.', StatusCode.BAD_REQUEST)

    game = WordwallsGame()
    tablenum = game.initialize_daily_challenge(
        request.user, lex, challenge_name, dt, use_table=body['tablenum'])

    return response({
        'tablenum': tablenum,
        'list_name': game.get_wgm(tablenum, lock=False).word_list.name
    })
    # XXX: Need to write tests around this behavior.


# api views helpers

def access_to_table(tablenum, user):
    """ Return whether user has access to table. For now we just use
    the wordwalls game model. We should fix the logic for multiplayer
    afterwards. """
    game = WordwallsGame()
    return game.permit(user, tablenum)


def date_from_request_dict(request_dict):
    """ Get the date from the given request dictionary. """
    # YYYY-mm-dd
    dt = request_dict.get('date')
    today = date.today()
    try:
        ch_date = datetime.strptime(dt, '%Y-%m-%d').date()
    except (ValueError, TypeError):
        ch_date = today

    if ch_date > today:
        ch_date = today

    return ch_date


def challengers(dt, lex, ch_id):
    try:
        lex = Lexicon.objects.get(pk=lex)
        ch_name = DailyChallengeName.objects.get(pk=ch_id)
    except ObjectDoesNotExist:
        return response('Bad lexicon or challenge.', StatusCode.BAD_REQUEST)

    return getLeaderboardData(lex, ch_name, dt)
