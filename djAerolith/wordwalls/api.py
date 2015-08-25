import json
from django.http import HttpResponseForbidden
from datetime import date, timedelta
from wordwalls.models import (WordwallsGameModel,
                              DailyChallenge,
                              DailyChallengeName)
from base.models import Lexicon, Alphagram, Word, probPKToAlphProb
import time
import random
from lib.response import response, bad_request
from wordwalls.views import getLeaderboardData


def configure(request):
    prefs = json.loads(request.body)
    if request.method == "POST":
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

        profile = request.user.get_profile()
        profile.customWordwallsStyle = json.dumps(saveObj)
        profile.save()
        return response("Ok")

    return HttpResponseForbidden("Cannot save preferences.")


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


def api_random_toughie(request):
    from wordwalls.management.commands.genMissedBingoChalls import (
        challengeDateFromReqDate)
    # from the PREVIOUS toughies challenge
    chdate = challengeDateFromReqDate(date.today()) - timedelta(days=7 * 20)
    try:
        dc = DailyChallenge.objects.get(
            lexicon=Lexicon.objects.get(pk=4),
            date=chdate,
            name=DailyChallengeName.objects.get(
                name=DailyChallengeName.WEEKS_BINGO_TOUGHIES))
    except DailyChallenge.DoesNotExist:
        return response({"error": "No such daily challenge."})
    alphs = json.loads(dc.alphagrams)

    alpha = Alphagram.objects.get(pk=random.choice(alphs))
    words = Word.objects.filter(alphagram=alpha)
    wordString = " ".join([word.word for word in words])
    alphaString = alpha.alphagram
    html = """
    <script>
    $("#toughie").hover(function() {
        $(this).text("%s");
    },
    function() {
        $(this).text("%s");
    });</script>
    <div id="toughie" style="font-size: 32px;">%s</div>
    """ % (wordString, alphaString, alphaString)

    return response({"html": html})


# api views helpers
def challengers(month, day, year, lex, ch_id):
    rows = [['User', 'Score', 'Time remaining']]
    try:
        lex = Lexicon.objects.get(pk=lex).lexiconName
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


# View
def questions(request, tablenum):
    """
    Get a list of questions and answers for a table. Disregards state,
    just return the questions/answers in origQuestions.

    """
    try:
        wgm = WordwallsGameModel.objects.get(pk=tablenum)
    except WordwallsGameModel.DoesNotExist:
        return bad_request('That table does not exist.')

    orig_questions = json.loads(wgm.origQuestions)
    if len(orig_questions) > 1000:
        return bad_request('This API only works for tables with fewer than '
                           '1000 questions.')
    questions = []
    for q in orig_questions:
        words = []
        if type(q) is int:
            a = Alphagram.objects.get(pk=q)
            alphagram_str = a.alphagram
            alphagram_pk = a.pk
            word_set = a.word_set.all()
        elif type(q) is dict:
            alphagram_str = q['q']
            alphagram_pk = None
            word_set = [Word.objects.get(pk=word_pk) for word_pk in q['a']]

        for w in word_set:
            words.append(w.to_dict())
        questions.append({'a': alphagram_str, 'ws': words,
                          'p': probPKToAlphProb(alphagram_pk)})
    return response({'count': len(questions), 'questions': questions})
