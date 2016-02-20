import json
from datetime import date, datetime, timedelta
import logging

from django.core.exceptions import ObjectDoesNotExist

from wordwalls.models import DailyChallengeName
from base.models import Lexicon
from lib.response import response, StatusCode
from wordwalls.views import getLeaderboardData
logger = logging.getLogger(__name__)


def configure(request):
    if request.method != "POST":
        return response("Must use POST.", StatusCode.FORBIDDEN)

    prefs = json.loads(request.body)
    saveObj = {'tc': {}, 'bc': {}}
    saveObj['tc'] = {'on': prefs['tilesOn'],
                     'font': prefs['font'],
                     'selection': prefs['tileSelection'],
                     'bold': prefs['bold'],
                     'blankCharacter': prefs['blankCharacter'],
                     'customOrder': prefs['customOrder']}
    saveObj['bc'] = {'showTable': prefs['showTable'],
                     'showCanvas': prefs['showCanvas'],
                     'showBorders': prefs['showBorders']}

    profile = request.user.aerolithprofile
    profile.customWordwallsStyle = json.dumps(saveObj)
    profile.save()
    return response("OK")


# API Views. No Auth required.
def api_challengers(request):
    if request.method != 'GET':
        return response('Must use GET.', StatusCode.BAD_REQUEST)
    lex = request.GET.get('lexicon')
    ch_id = request.GET.get('challenge')
    # YYYY-mm-dd
    dt = request.GET.get('date')
    try:
        ch_date = datetime.strptime(dt, '%Y-%m-%d')
    except (ValueError, TypeError):
        ch_date = date.today()

    return response(challengers(ch_date, lex, ch_id))


# def api_challengers_days_from_today(request, days, lex, ch_id):
#     dt = date.today() - timedelta(days=int(days))
#     return response(challengers(dt, lex, ch_id))


# api views helpers
def challengers(dt, lex, ch_id):
    try:
        lex = Lexicon.objects.get(pk=lex)
        ch_name = DailyChallengeName.objects.get(pk=ch_id)
    except ObjectDoesNotExist:
        return response('Bad lexicon or challenge.', StatusCode.BAD_REQUEST)

    return getLeaderboardData(lex, ch_name, dt)
