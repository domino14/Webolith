import json
from datetime import date, timedelta
import time

from wordwalls.models import WordwallsGameModel, DailyChallengeName
from base.models import Lexicon
from lib.response import response, StatusCode
from wordwalls.views import getLeaderboardData


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


# api views
def api_challengers(request, month, day, year, lex, ch_id):
    # the people who have done daily challenges
    # used to test a certain pull api :P
    rows = challengers(month, day, year, lex, ch_id)
    return response({"table": rows})


def api_challengers_days_from_today(request, days, lex, ch_id):
    day = date.today() - timedelta(days=int(days))
    rows = challengers(day.month, day.day, day.year, lex, ch_id)
    return response({"table": rows})


def api_num_tables_created(request):
    allGames = WordwallsGameModel.objects.all().reverse()[:1]
    numTables = allGames[0].pk
    return response({"number": numTables, "timestamp": time.time()})


# api views helpers
def challengers(month, day, year, lex, ch_id):
    rows = [['User', 'Score', 'Time remaining']]
    try:
        lex = Lexicon.objects.get(pk=lex)
        chName = DailyChallengeName.objects.get(pk=ch_id)
        chDate = date(day=int(day), month=int(month), year=int(year))

        data = getLeaderboardData(lex, chName, chDate)
    except:
        import traceback
        print traceback.format_exc()

    try:
        maxScore = data['maxScore']
        for entry in data['entries']:
            user = entry['user']
            score = '%.1f%%' % (
                100 * (float(entry['score']) / float(maxScore)))
            tr = entry['tr']
            rows.append([user, score, tr])

    except:
        pass
    return rows
