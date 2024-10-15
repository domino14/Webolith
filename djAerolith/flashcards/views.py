import logging
import json

from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from django.conf import settings

from base.models import Lexicon, WordList
from base.utils import generate_question_map, quizzes_response
from lib.auth import create_jwt
from lib.response import response
from lib.wdb_interface.wdb_helper import (
    word_search,
    add_to_wordvault as wdb_add_to_wordvault,
)
from lib.wdb_interface.exceptions import WDBError
from lib.wdb_interface.word_searches import temporary_list_name
from wordwalls.api import build_search_criteria
from wordwalls.game import GameInitException

logger = logging.getLogger(__name__)


@login_required
def main(request):
    quizzes = WordList.objects.filter(user=request.user, is_temporary=False)
    return render(
        request,
        "flashcards/index.html",
        {
            "numCards": 0,
            "savedLists": json.dumps(quizzes_response(quizzes)),
            "STATIC_SRV": (
                settings.WEBPACK_DEV_SERVER_URL
                if (settings.USE_WEBPACK_DEV_SERVER and settings.DEBUG)
                else ""
            ),
        },
    )


@login_required
def new_quiz(request):
    """
    Create a new quiz but doesn't create any 'card' models.
    Card models will only be used for cardbox in future.
    """
    body = json.loads(request.body)
    logger.debug(body)
    lexicon = Lexicon.objects.get(lexiconName=body["lexicon"])
    try:
        search_description = build_search_criteria(
            request.user, lexicon, body["searchCriteria"]
        )
    except GameInitException as e:
        return response(str(e), status=400)

    questions = word_search(search_description, expand=True)
    if questions.size() == 0:
        return response("No questions were found.", status=400)
    wl = WordList()
    wl.initialize_list(
        list(questions.to_python()), lexicon, None, shuffle=True, save=False
    )
    q_map = generate_question_map(questions)
    quiz_name = temporary_list_name(search_description, lexicon.lexiconName)
    # XXX add 1000-question limit?
    return response(
        {
            "list": wl.to_python(),
            "q_map": q_map,
            "quiz_name": quiz_name,
        }
    )


@login_required
def add_to_wordvault(request):
    body = json.loads(request.body)
    logger.debug(body)
    lexicon = Lexicon.objects.get(lexiconName=body["lexicon"])
    try:
        search_description = build_search_criteria(
            request.user, lexicon, body["searchCriteria"]
        )
    except GameInitException as e:
        return response(str(e), status=400)

    try:
        questions = word_search(search_description, expand=False)
    except WDBError as e:
        return response(str(e), status=400)
    if questions.size() == 0:
        return response("No questions were found.", status=400)

    # Shuffle before adding to avoid things like alphabetical order.
    questions.shuffle()
    alphagrams = questions.alphagram_string_list()
    token = create_jwt(request.user)
    try:
        num_added = wdb_add_to_wordvault(alphagrams, lexicon.lexiconName, token)
    except Exception as e:
        return response(str(e), status=400)

    return response({"msg": f"{num_added} cards were added"})
