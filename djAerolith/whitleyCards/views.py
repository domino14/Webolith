import base64
import json
import logging
import zlib

from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.urls import reverse

from lib.response import response
from lib.wdb_interface.wdb_helper import (
    word_search,
    questions_from_alpha_dicts,
    questions_from_probability_range,
)
from wordwalls.api import build_search_criteria
from base.forms import LexiconForm, NamedListForm, SavedListForm
from wordwalls.models import NamedList
from base.models import Lexicon, WordList

logger = logging.getLogger(__name__)

QUIZ_CHUNK_SIZE = 5000


class ImproperCodingException(Exception):
    pass


@login_required
def createQuiz(request):
    if request.method == "GET":
        return render(request, "whitleyCards/index.html", {"accessedWithGet": True})
    elif request.method == "POST":
        return handle_create_post(request)


def search_criteria_to_b64(request_post):
    search = []
    idx = 0

    while True:
        new_search = {}
        key = "searchCriteria[{}]".format(idx)
        search_type = request_post.get("{}[searchType]".format(key))
        if not search_type:
            break
        try:
            search_type = int(search_type)
        except ValueError:
            raise ImproperCodingException()
        new_search["searchType"] = search_type

        for k in ("minValue", "maxValue", "value"):
            v = request_post.get("{}[{}]".format(key, k))
            if v:
                new_search[k] = v
        search.append(new_search)
        idx += 1

    dumped = json.dumps(search, separators=(",", ":"))
    logger.debug("Encoding %s", dumped)
    return base64.urlsafe_b64encode(zlib.compress(bytes(dumped, "utf-8")))


def search_criteria_from_b64(encoded):
    d = base64.urlsafe_b64decode(bytes(encoded, "utf-8"))
    return json.loads(zlib.decompress(d))


def handle_create_post(request):
    action = request.POST.get("action")
    if action == "searchParamsFlashcard":
        # form bound to the POST data
        lexForm = LexiconForm(request.POST)
        if lexForm.is_valid():
            lex = Lexicon.objects.get(lexiconName=lexForm.cleaned_data["lexicon"])
            logger.debug("POST data %s", request.POST)
            try:
                encoded_search = search_criteria_to_b64(request.POST)
            except ImproperCodingException:
                return response(
                    {"success": False, "error": "Please refresh; the app has changed."},
                    status=400,
                )
            return response(
                {
                    "url": reverse(
                        "flashcards_by_search", args=(lex.pk, encoded_search.decode())
                    ),
                    "success": True,
                }
            )

    elif action == "namedListsFlashcard":
        lexForm = LexiconForm(request.POST)
        nlForm = NamedListForm(request.POST)
        if lexForm.is_valid() and nlForm.is_valid():
            lex = Lexicon.objects.get(lexiconName=lexForm.cleaned_data["lexicon"])
            # lex doesn't matter
            return response(
                {
                    "url": reverse(
                        "flashcards_by_namedList_pk",
                        args=(nlForm.cleaned_data["namedList"].pk,),
                    ),
                    "success": True,
                }
            )
    elif action == "savedListsFlashcardEntire" or action == "savedListsFlashcardFM":
        lexForm = LexiconForm(request.POST)
        slForm = SavedListForm(request.POST)
        if lexForm.is_valid() and slForm.is_valid():
            lex = Lexicon.objects.get(lexiconName=lexForm.cleaned_data["lexicon"])
            # lex doesn't matter

            if request.POST["action"] == "savedListsFlashcardEntire":
                option = SavedListForm.RESTART_LIST_CHOICE
            elif request.POST["action"] == "savedListsFlashcardFM":
                option = SavedListForm.FIRST_MISSED_CHOICE

            return response(
                {
                    "url": reverse(
                        "flashcards_by_savedList_pk",
                        args=(slForm.cleaned_data["wordList"].pk, option),
                    ),
                    "success": True,
                }
            )
            # don't do any checking right now for user access to
            # other user lists. why? maybe people can share lists
            # this way as long as we're not letting the users delete
            # lists, i think it should be fine.
    return response(
        {"success": False, "error": "Did you select a list to flashcard?"}, status=400
    )


def getQuizChunkByProb(lexicon, length, minP, maxP):
    maxPGet = maxP
    newMinP = -1
    if maxP - minP + 1 > QUIZ_CHUNK_SIZE:
        # only quiz on first 100 and send new lower limit as part of data
        newMinP = minP + QUIZ_CHUNK_SIZE
        maxPGet = newMinP - 1
    wordData = getWordDataByProb(lexicon, length, minP, maxPGet)
    return (wordData, newMinP, maxP)


def getQuizChunkByQuestions(lexicon, questions, minIndex, is_q_obj=False):
    maxIndexGet = len(questions) - 1
    newMinIndex = -1
    if len(questions) > QUIZ_CHUNK_SIZE:
        maxIndexGet = minIndex + QUIZ_CHUNK_SIZE - 1
        newMinIndex = minIndex + QUIZ_CHUNK_SIZE

    if is_q_obj:
        # The `questions` obj already contains the words, etc.
        wordData = get_word_data(questions[minIndex : maxIndexGet + 1])
    else:
        wordData = getWordDataFromQuestions(
            lexicon, questions[minIndex : maxIndexGet + 1]
        )
    # will get minIndex to maxIndexGet inclusive
    return (wordData, newMinIndex, len(questions) - 1)


@login_required
def search(request, lex_id, paramsb64):
    if request.method == "GET":
        return render(request, "whitleyCards/quiz.html")
    elif request.method == "POST":
        action = request.POST["action"]
        lex = Lexicon.objects.get(pk=lex_id)

        if not lex.is_supported:
            return response(
                {"error": "The selected lexicon is not supported. Please choose a valid lexicon."},
                status=400,
            )

        search_params = build_search_criteria(
            request.user, lex, search_criteria_from_b64(paramsb64)
        )
        try:
            questions = word_search(search_params, expand=True)
        except WDBError as e:
            return response({"error": str(e)}, status=500)

        if action == "getInitialSet":
            data = getQuizChunkByQuestions(lex, questions, 0, is_q_obj=True)
            return response(
                {
                    "data": data[0],
                    "nextMinP": data[1],
                    "nextMaxP": data[2],
                    "numAlphas": questions.size(),
                }
            )

        elif action == "getNextSet":
            minP = int(request.POST["minP"])

            if minP == -1:
                return response({"data": []})

            maxP = int(request.POST["maxP"])
            logger.info("getting set %s, %s", minP, maxP)
            data = getQuizChunkByQuestions(lex, questions, minP, is_q_obj=True)
            return response({"data": data[0], "nextMinP": data[1], "nextMaxP": data[2]})


def getQuizChunkFromNamedList(nlpk, minIndex):
    nl = NamedList.objects.get(pk=nlpk)
    questions = json.loads(nl.questions)
    if nl.isRange:
        data = getQuizChunkByProb(
            nl.lexicon, nl.wordLength, questions[0] + minIndex, questions[1]
        )
        if data[1] != -1:
            return (data[0], data[1] - questions[0], data[2])
        else:
            return (data[0], -1, data[2])
    else:
        data = getQuizChunkByQuestions(nl.lexicon, questions, minIndex)
        return data


@login_required
def namedListPk(request, nlpk):
    if request.method == "GET":
        return render(request, "whitleyCards/quiz.html")
    elif request.method == "POST":
        action = request.POST["action"]
        if action == "getInitialSet":
            data = getQuizChunkFromNamedList(nlpk, 0)
            return response(
                {
                    "data": data[0],
                    "nextMinP": data[1],
                    "nextMaxP": data[2],
                    "numAlphas": NamedList.objects.get(pk=nlpk).numQuestions,
                }
            )
        elif action == "getNextSet":
            minP = int(request.POST["minP"])
            if minP == -1:  # quiz is over
                return response({"data": []})
            maxP = int(request.POST["maxP"])
            # these are now indices
            logger.info("getting set %s, %s", minP, maxP)
            data = getQuizChunkFromNamedList(nlpk, minP)
            return response({"data": data[0], "nextMinP": data[1], "nextMaxP": data[2]})


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
        return data[0], data[1], data[2], sl.numFirstMissed


@login_required
def savedListPk(request, slpk, option):
    if request.method == "GET":
        return render(request, "whitleyCards/quiz.html")
    elif request.method == "POST":
        action = request.POST["action"]
        if action == "getInitialSet":
            data = getQuizChunkFromSavedList(slpk, 0, int(option))
            return response(
                {
                    "data": data[0],
                    "nextMinP": data[1],
                    "nextMaxP": data[2],
                    "numAlphas": data[3],
                }
            )
        elif action == "getNextSet":
            minP = int(request.POST["minP"])

            if minP == -1:  # quiz is over
                return response({"data": []})

            maxP = int(request.POST["maxP"])
            logger.info("getting set %s, %s", minP, maxP)
            data = getQuizChunkFromSavedList(slpk, minP, int(option))
            return response({"data": data[0], "nextMinP": data[1], "nextMaxP": data[2]})


def getWordDataByProb(lexicon, length, minP, maxP):
    questions = questions_from_probability_range(
        lexicon, minP, maxP, length, expand=True
    )
    return get_word_data(questions.questions_array())


def getWordDataFromQuestions(lexicon, questions):
    questions = questions_from_alpha_dicts(lexicon, questions)
    return get_word_data(questions.questions_array())


def get_word_data(questions_array):
    data = []
    for question in questions_array:
        for word in question.answers:
            data.append({"w": word.word, "d": word.definition})
    return data