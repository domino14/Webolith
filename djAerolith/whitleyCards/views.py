from django.shortcuts import render_to_response
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseRedirect, HttpResponse
from django.template import RequestContext
from wordwalls.views import searchForAlphagrams
from wordwalls.forms import LexiconForm, FindWordsForm, NamedListForm, SavedListForm
from wordwalls.models import NamedList, SavedList
from base.models import Lexicon, Alphagram
import json
from django.core.urlresolvers import reverse

QUIZ_CHUNK_SIZE = 1000

@login_required
def createQuiz(request):
    if request.method == 'GET':
        return render_to_response('whitleyCards/index.html',
                            {'accessedWithGet': True },
                            context_instance=RequestContext(request))
    elif request.method == 'POST':
        if request.POST['action'] == 'searchParamsFlashcard':
            lexForm = LexiconForm(request.POST)
            fwForm = FindWordsForm(request.POST)   # form bound to the POST data
            if lexForm.is_valid() and fwForm.is_valid():
                lex = Lexicon.objects.get(lexiconName=lexForm.cleaned_data['lexicon'])
                asd = searchForAlphagrams(fwForm.cleaned_data, lex)
                #questionData = getWordDataByProb(alphasSearchDescription['min'], alphasSearchDescription['max'])
                response = HttpResponse(json.dumps(
                                                    {'url': reverse('flashcards_by_prob_pk_range', args=(asd['min'], asd['max'])),
                                                    'success': True}
                                                    ),
                                                    mimetype="application/javascript")
                response['Content-Type'] = 'text/plain; charset=utf-8'
                return response

        if request.POST['action'] == 'namedListsFlashcard':
            lexForm = LexiconForm(request.POST)
            nlForm = NamedListForm(request.POST)
            if lexForm.is_valid() and nlForm.is_valid():
                lex = Lexicon.objects.get(lexiconName=lexForm.cleaned_data['lexicon'])
                # lex doesn't matter
                response = HttpResponse(json.dumps(
                                                    {'url': reverse('flashcards_by_namedList_pk',
                                                                args=(nlForm.cleaned_data['namedList'].pk,)),
                                                    'success': True}
                                                    ),
                                                    mimetype="application/javascript")
                response['Content-Type'] = 'text/plain; charset=utf-8'
                return response
        elif request.POST['action'] == 'savedListsFlashcardEntire' or request.POST['action'] == 'savedListsFlashcardFM':
            lexForm = LexiconForm(request.POST)
            slForm = SavedListForm(request.POST)
            if lexForm.is_valid() and slForm.is_valid():
                lex = Lexicon.objects.get(lexiconName=lexForm.cleaned_data['lexicon'])
                # lex doesn't matter

                if request.POST['action'] == 'savedListsFlashcardEntire':
                    option = SavedListForm.RESTART_LIST_CHOICE
                elif request.POST['action'] == 'savedListsFlashcardFM':
                    option = SavedListForm.FIRST_MISSED_CHOICE

                response = HttpResponse(json.dumps(
                                                        {'url': reverse('flashcards_by_savedList_pk',
                                                                        args=(slForm.cleaned_data['wordList'].pk,
                                                                            option)),
                                                            'success': True}
                                                            ),
                                                            mimetype="application/javascript")
                response['Content-Type'] = 'text/plain; charset=utf-8'
                return response
                # don't do any checking right now for user access to other user lists. why? maybe people can share lists this way
                # as long as we're not letting the users delete lists, i think it should be fine.
    response = HttpResponse(json.dumps({'success': False,
                                        'error': 'Did you select a list to '
                                                 'flashcard?'}),
                                       mimetype="application/javascript")
    response['Content-Type'] = 'text/plain; charset=utf-8'
    return response

def getQuizChunkByProb(minP, maxP):
    maxPGet = maxP
    newMinP = -1
    if maxP-minP+1 > QUIZ_CHUNK_SIZE:
        # only quiz on first 100 and send new lower limit as part of data
        newMinP = minP + QUIZ_CHUNK_SIZE
        maxPGet = newMinP - 1
    wordData = getWordDataByProb(minP, maxPGet)
    return (wordData, newMinP, maxP)

def getQuizChunkByIndices(indices, minIndex):
    maxIndexGet = len(indices) - 1
    newMinIndex = -1
    if len(indices) > QUIZ_CHUNK_SIZE:
        maxIndexGet = minIndex + QUIZ_CHUNK_SIZE - 1
        newMinIndex = minIndex + QUIZ_CHUNK_SIZE

    wordData = getWordDataFromIndices(indices[minIndex:maxIndexGet+1])  # will get minIndex to maxIndexGet inclusive
    return (wordData, newMinIndex, len(indices) - 1)


@login_required
def probPkRange(request, minP, maxP):
    if request.method == 'GET':
        return render_to_response('whitleyCards/quiz.html', context_instance=RequestContext(request))
    elif request.method == 'POST':
        action = request.POST['action']
        if action == 'getInitialSet':
            minP = int(minP)
            maxP = int(maxP)

            data = getQuizChunkByProb(minP, maxP)

            response = HttpResponse(json.dumps(
                                                {'data': data[0],
                                                'nextMinP': data[1],
                                                'nextMaxP': data[2],
                                                'numAlphas': maxP-minP+1 }
                                                ),
                                                mimetype="application/javascript")
            response['Content-Type'] = 'text/plain; charset=utf-8'
            return response
        elif action == 'getNextSet':
            minP = int(request.POST['minP'])

            if minP == -1: # quiz is over
                response = HttpResponse(json.dumps({'data': []}),
                                                    mimetype="application/javascript")
                response['Content-Type'] = 'text/plain; charset=utf-8'
                return response

            maxP = int(request.POST['maxP'])
            print "getting set", minP, maxP

            data = getQuizChunkByProb(minP, maxP)
            response = HttpResponse(json.dumps(
                                                {'data': data[0],
                                                'nextMinP': data[1],
                                                'nextMaxP': data[2] }
                                                ),
                                                mimetype="application/javascript")
            response['Content-Type'] = 'text/plain; charset=utf-8'
            return response

def getQuizChunkFromNamedList(nlpk, minIndex):
    nl = NamedList.objects.get(pk=nlpk)
    questions = json.loads(nl.questions)
    if nl.isRange:
        data = getQuizChunkByProb(questions[0] + minIndex, questions[1])
        if data[1] != -1:
            return (data[0], data[1] - questions[0], data[2])
        else:
            return (data[0], -1, data[2])
    else:
        data = getQuizChunkByIndices(questions, minIndex)
        return data


@login_required
def namedListPk(request, nlpk):
    if request.method == 'GET':
        return render_to_response('whitleyCards/quiz.html', context_instance=RequestContext(request))
    elif request.method == 'POST':
        action = request.POST['action']
        if action == 'getInitialSet':
            data = getQuizChunkFromNamedList(nlpk, 0)
            response = HttpResponse(json.dumps(
                                                {'data': data[0],
                                                'nextMinP': data[1],
                                                'nextMaxP': data[2],
                                                'numAlphas': NamedList.objects.get(pk=nlpk).numQuestions }
                                                ),
                                                mimetype="application/javascript")
            response['Content-Type'] = 'text/plain; charset=utf-8'
            return response
        elif action == 'getNextSet':
            minP = int(request.POST['minP'])
            if minP == -1: # quiz is over
                response = HttpResponse(json.dumps({'data': []}),
                                                    mimetype="application/javascript")
                response['Content-Type'] = 'text/plain; charset=utf-8'
                return response

            maxP = int(request.POST['maxP'])
            print "getting set", minP, maxP # these are now indices

            data = getQuizChunkFromNamedList(nlpk, minP)
            response = HttpResponse(json.dumps(
                                                {'data': data[0],
                                                'nextMinP': data[1],
                                                'nextMaxP': data[2] }
                                                ),
                                                mimetype="application/javascript")
            response['Content-Type'] = 'text/plain; charset=utf-8'
            return response

def getQuizChunkFromSavedList(slpk, minIndex, option):
    sl = SavedList.objects.get(pk=slpk)
    if option == SavedListForm.RESTART_LIST_CHOICE:
        questions = json.loads(sl.origQuestions)
        data = getQuizChunkByIndices(questions, minIndex)
        return data[0], data[1], data[2], sl.numAlphagrams
    elif option == SavedListForm.FIRST_MISSED_CHOICE:
        questionIndices = json.loads(sl.firstMissed)
        origQuestions = json.loads(sl.origQuestions)
        questions = [origQuestions[i] for i in questionIndices]
        data = getQuizChunkByIndices(questions, minIndex)
        print questions, data
        return data[0], data[1], data[2], sl.numFirstMissed

@login_required
def savedListPk(request, slpk, option):
    if request.method == 'GET':
        return render_to_response('whitleyCards/quiz.html', context_instance=RequestContext(request))
    elif request.method == 'POST':
        action = request.POST['action']
        if action == 'getInitialSet':
            data = getQuizChunkFromSavedList(slpk, 0, int(option))
            response = HttpResponse(json.dumps(
                                                {'data': data[0],
                                                'nextMinP': data[1],
                                                'nextMaxP': data[2],
                                                'numAlphas': data[3] }
                                                ),
                                                mimetype="application/javascript")
            response['Content-Type'] = 'text/plain; charset=utf-8'
            return response
        elif action == 'getNextSet':
            minP = int(request.POST['minP'])

            if minP == -1: # quiz is over
                response = HttpResponse(json.dumps({'data': []}),
                                                    mimetype="application/javascript")
                response['Content-Type'] = 'text/plain; charset=utf-8'
                return response

            maxP = int(request.POST['maxP'])
            print "getting set", minP, maxP # these are now indices

            data = getQuizChunkFromSavedList(slpk, minP, int(option))
            response = HttpResponse(json.dumps(
                                                {'data': data[0],
                                                'nextMinP': data[1],
                                                'nextMaxP': data[2] }
                                                ),
                                                mimetype="application/javascript")
            response['Content-Type'] = 'text/plain; charset=utf-8'
            return response



def getWordDataByProb(minP, maxP):
    data = []
    for i in range(minP, maxP+1):
        alpha = Alphagram.objects.get(pk=i)
        for j in alpha.word_set.all():
            data.append({'w': j.word, 'd': j.definition})

    return data

def getWordDataFromIndices(indices):
    data = []
    for i in indices:
        alpha = Alphagram.objects.get(pk=i)
        for j in alpha.word_set.all():
            data.append({'w': j.word, 'd': j.definition})

    return data