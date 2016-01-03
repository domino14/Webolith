import json
import logging

from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.core.urlresolvers import reverse

from lib.word_db_helper import WordDB
from lib.response import response
from wordwalls.views import searchForAlphagrams
from base.forms import LexiconForm, FindWordsForm, NamedListForm, SavedListForm
from wordwalls.models import NamedList
from base.models import Lexicon, WordList
logger = logging.getLogger(__name__)

QUIZ_CHUNK_SIZE = 5000


@login_required
def createQuiz(request):
    if request.method == 'GET':
        return render(request, 'whitleyCards/index.html',
                      {'accessedWithGet': True})
    elif request.method == 'POST':
        action = request.POST.get('action')
        if action == 'searchParamsFlashcard':
            lexForm = LexiconForm(request.POST)
            # form bound to the POST data
            fwForm = FindWordsForm(request.POST)
            if lexForm.is_valid() and fwForm.is_valid():
                lex = Lexicon.objects.get(
                    lexiconName=lexForm.cleaned_data['lexicon'])
                asd = searchForAlphagrams(fwForm.cleaned_data, lex)
                return response({
                    'url': reverse('flashcards_by_prob_range',
                                   args=(asd['lexicon'].pk, asd['length'],
                                         asd['min'], asd['max'])),
                    'success': True})

        elif action == 'namedListsFlashcard':
            lexForm = LexiconForm(request.POST)
            nlForm = NamedListForm(request.POST)
            if lexForm.is_valid() and nlForm.is_valid():
                lex = Lexicon.objects.get(
                    lexiconName=lexForm.cleaned_data['lexicon'])
                # lex doesn't matter
                return response({
                    'url': reverse(
                        'flashcards_by_namedList_pk',
                        args=(nlForm.cleaned_data['namedList'].pk,)),
                    'success': True})
        elif (action == 'savedListsFlashcardEntire' or
                action == 'savedListsFlashcardFM'):
            lexForm = LexiconForm(request.POST)
            slForm = SavedListForm(request.POST)
            if lexForm.is_valid() and slForm.is_valid():
                lex = Lexicon.objects.get(
                    lexiconName=lexForm.cleaned_data['lexicon'])
                # lex doesn't matter

                if request.POST['action'] == 'savedListsFlashcardEntire':
                    option = SavedListForm.RESTART_LIST_CHOICE
                elif request.POST['action'] == 'savedListsFlashcardFM':
                    option = SavedListForm.FIRST_MISSED_CHOICE

                return response({
                    'url': reverse('flashcards_by_savedList_pk',
                                   args=(slForm.cleaned_data['wordList'].pk,
                                         option)),
                    'success': True})
                # don't do any checking right now for user access to
                # other user lists. why? maybe people can share lists
                # this way as long as we're not letting the users delete
                # lists, i think it should be fine.
    return response({'success': False,
                     'error': 'Did you select a list to flashcard?'},
                    status=400)


def getQuizChunkByProb(lexicon, length, minP, maxP):
    maxPGet = maxP
    newMinP = -1
    if maxP-minP+1 > QUIZ_CHUNK_SIZE:
        # only quiz on first 100 and send new lower limit as part of data
        newMinP = minP + QUIZ_CHUNK_SIZE
        maxPGet = newMinP - 1
    wordData = getWordDataByProb(lexicon, length, minP, maxPGet)
    return (wordData, newMinP, maxP)


def getQuizChunkByQuestions(lexicon, questions, minIndex):
    maxIndexGet = len(questions) - 1
    newMinIndex = -1
    if len(questions) > QUIZ_CHUNK_SIZE:
        maxIndexGet = minIndex + QUIZ_CHUNK_SIZE - 1
        newMinIndex = minIndex + QUIZ_CHUNK_SIZE

    wordData = getWordDataFromQuestions(lexicon,
                                        questions[minIndex:maxIndexGet+1])
    # will get minIndex to maxIndexGet inclusive
    return (wordData, newMinIndex, len(questions) - 1)


@login_required
def prob_range(request, lexid, length, minP, maxP):
    lexicon = Lexicon.objects.get(pk=lexid)
    if request.method == 'GET':
        return render(request, 'whitleyCards/quiz.html')
    elif request.method == 'POST':
        action = request.POST['action']
        if action == 'getInitialSet':
            minP = int(minP)
            maxP = int(maxP)
            data = getQuizChunkByProb(lexicon, length, minP, maxP)
            return response({'data': data[0],
                             'nextMinP': data[1],
                             'nextMaxP': data[2],
                             'numAlphas': maxP-minP+1})
        elif action == 'getNextSet':
            minP = int(request.POST['minP'])

            if minP == -1:  # quiz is over
                return response({'data': []})

            maxP = int(request.POST['maxP'])
            logger.debug("getting set %s, %s", minP, maxP)
            data = getQuizChunkByProb(lexicon, length, minP, maxP)
            return response({'data': data[0],
                             'nextMinP': data[1],
                             'nextMaxP': data[2]})


def getQuizChunkFromNamedList(nlpk, minIndex):
    nl = NamedList.objects.get(pk=nlpk)
    questions = json.loads(nl.questions)
    if nl.isRange:
        data = getQuizChunkByProb(nl.lexicon, nl.wordLength,
                                  questions[0] + minIndex,
                                  questions[1])
        if data[1] != -1:
            return (data[0], data[1] - questions[0], data[2])
        else:
            return (data[0], -1, data[2])
    else:
        data = getQuizChunkByQuestions(nl.lexicon, questions, minIndex)
        return data


@login_required
def namedListPk(request, nlpk):
    if request.method == 'GET':
        return render(request, 'whitleyCards/quiz.html')
    elif request.method == 'POST':
        action = request.POST['action']
        if action == 'getInitialSet':
            data = getQuizChunkFromNamedList(nlpk, 0)
            return response({
                'data': data[0],
                'nextMinP': data[1],
                'nextMaxP': data[2],
                'numAlphas': NamedList.objects.get(pk=nlpk).numQuestions})
        elif action == 'getNextSet':
            minP = int(request.POST['minP'])
            if minP == -1:  # quiz is over
                return response({'data': []})
            maxP = int(request.POST['maxP'])
            # these are now indices
            logger.debug("getting set %s, %s", minP, maxP)
            data = getQuizChunkFromNamedList(nlpk, minP)
            return response({'data': data[0],
                             'nextMinP': data[1],
                             'nextMaxP': data[2]})


def getQuizChunkFromSavedList(slpk, minIndex, option):
    sl = WordList.objects.get(pk=slpk)
    if option == SavedListForm.RESTART_LIST_CHOICE:
        questions = json.loads(sl.origQuestions)
        data = getQuizChunkByQuestions(sl.lexicon, questions, minIndex)
        return data[0], data[1], data[2], sl.numAlphagrams
    elif option == SavedListForm.FIRST_MISSED_CHOICE:
        questionIndices = json.loads(sl.firstMissed)
        origQuestions = json.loads(sl.origQuestions)
        questions = [origQuestions[i] for i in questionIndices]
        data = getQuizChunkByQuestions(sl.lexicon, questions, minIndex)
        print questions, data
        return data[0], data[1], data[2], sl.numFirstMissed


@login_required
def savedListPk(request, slpk, option):
    if request.method == 'GET':
        return render(request, 'whitleyCards/quiz.html')
    elif request.method == 'POST':
        action = request.POST['action']
        if action == 'getInitialSet':
            data = getQuizChunkFromSavedList(slpk, 0, int(option))
            return response({'data': data[0],
                             'nextMinP': data[1],
                             'nextMaxP': data[2],
                             'numAlphas': data[3]})
        elif action == 'getNextSet':
            minP = int(request.POST['minP'])

            if minP == -1:  # quiz is over
                return response({'data': []})

            maxP = int(request.POST['maxP'])
            logger.debug("getting set %s, %s", minP, maxP)
            data = getQuizChunkFromSavedList(slpk, minP, int(option))
            return response({'data': data[0],
                             'nextMinP': data[1],
                             'nextMaxP': data[2]})


def getWordDataByProb(lexicon, length, minP, maxP):
    db = WordDB(lexicon.lexiconName)
    questions = db.get_questions_for_probability_range(minP, maxP, length)
    return get_word_data(questions.questions_array())


def getWordDataFromQuestions(lexicon, questions):
    db = WordDB(lexicon.lexiconName)
    questions = db.get_questions_from_alph_objects(questions)
    return get_word_data(questions.questions_array())


def get_word_data(questions_array):
    data = []
    for question in questions_array:
        for word in question.answers:
            data.append({'w': word.word, 'd': word.definition})
    return data
