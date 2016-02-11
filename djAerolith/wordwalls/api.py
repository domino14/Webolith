import json
from datetime import date, datetime, timedelta
import time
import logging

from django.core.exceptions import ObjectDoesNotExist

from wordwalls.models import WordwallsGameModel, DailyChallengeName
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


# API Views
def api_challengers(request):
    if request.method != 'GET':
        return response('Must use GET.', StatusCode.BAD_REQUEST)
    lex = request.GET.get('lexicon')
    ch_id = request.GET.get('challenge')
    # YYYY-mm-dd
    dt = request.GET.get('date')
    return challengers(dt, lex, ch_id)


def api_challengers_days_from_today(request, days, lex, ch_id):
    day = date.today() - timedelta(days=int(days))
    rows = challengers(day.month, day.day, day.year, lex, ch_id)
    return response({"table": rows})


def api_num_tables_created(request):
    allGames = WordwallsGameModel.objects.all().reverse()[:1]
    numTables = allGames[0].pk
    return response({"number": numTables, "timestamp": time.time()})


# api views helpers
def challengers(dt, lex, ch_id):
    try:
        lex = Lexicon.objects.get(pk=lex)
        ch_name = DailyChallengeName.objects.get(pk=ch_id)
    except ObjectDoesNotExist:
        return response('Bad lexicon or challenge.', StatusCode.BAD_REQUEST)
    try:
        ch_date = datetime.strptime(dt, '%Y-%m-%d')
    except (ValueError, TypeError):
        ch_date = date.today()

    data = getLeaderboardData(lex, ch_name, ch_date)
    return response(data)

    # rows = [['User', 'Score', 'Time remaining']]
    # try:
    #     lex = Lexicon.objects.get(pk=lex)
    #     chName = DailyChallengeName.objects.get(pk=ch_id)
    #     chDate = date(day=int(day), month=int(month), year=int(year))

    #     data = getLeaderboardData(lex, chName, chDate)
    # except:
    #     import traceback
    #     print traceback.format_exc()

    # try:
    #     maxScore = data['maxScore']
    #     for entry in data['entries']:
    #         user = entry['user']
    #         score = '%.1f%%' % (
    #             100 * (float(entry['score']) / float(maxScore)))
    #         tr = entry['tr']
    #         rows.append([user, score, tr])

    # except:
    #     pass
    # return rows
