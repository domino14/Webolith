import logging
import json

from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from django.conf import settings

from base.models import Lexicon, WordList
from base.utils import generate_question_map, quizzes_response
from lib.response import response
from lib.word_db_helper import word_search
from lib.word_searches import temporary_list_name
from wordwalls.api import build_search_criteria
from wordwalls.game import GameInitException

logger = logging.getLogger(__name__)


@login_required
def main(request):
    quizzes = WordList.objects.filter(user=request.user, is_temporary=False)
    return render(request, "flashcards/index.html", {
                  'numCards': 0,
                  'savedLists': json.dumps(quizzes_response(
                                           quizzes)),
                  'STATIC_SRV': (
                      settings.WEBPACK_DEV_SERVER_URL if (
                          settings.USE_WEBPACK_DEV_SERVER and settings.DEBUG)
                      else '')
                  })


@login_required
def new_quiz(request):
    """
    Create a new quiz but doesn't create any 'card' models.
    Card models will only be used for cardbox in future.
    """
    body = json.loads(request.body)
    logger.debug(body)
    lexicon = Lexicon.objects.get(lexiconName=body['lexicon'])
    try:
        search_description = build_search_criteria(
            request.user, lexicon, body['searchCriteria']
        )
    except GameInitException as e:
        return response(str(e), status=400)

    questions = word_search(search_description)
    if questions.size() == 0:
        return response('No questions were found.', status=400)
    wl = WordList()
    wl.initialize_list(list(questions.to_python()), lexicon, None,
                       shuffle=True, save=False)
    q_map = generate_question_map(questions)
    quiz_name = temporary_list_name(search_description,
                                    lexicon.lexiconName)
    # XXX add 1000-question limit?
    return response({
        'list': wl.to_python(),
        'q_map': q_map,
        'quiz_name': quiz_name,
    })


# @login_required
# def load_into_cardbox(request):
#     body = json.loads(request.body)
#     lexicon = Lexicon.objects.get(lexiconName=body['lex'].upper())
#     min_pk = alphProbToProbPK(int(body['min']), lexicon.pk,
#                               int(body['length']))
#     max_pk = alphProbToProbPK(int(body['max']), lexicon.pk,
#                               int(body['length']))
#     rg = range(min_pk, max_pk + 1)
#     # For every alphagram, see if we already have a card for this user,
#     # if not, create it.
#     user_cards = Card.objects.filter(user=request.user)
#     start = time.time()
#     now = datetime.today()
#     for ppk in rg:
#         # Create a new card.
#         try:
#             card = Card(alphagram=Alphagram.objects.get(probability_pk=ppk),
#                         user=request.user, next_scheduled=now)
#         except Alphagram.DoesNotExist:
#             continue
#         try:
#             card.save()
#         except IntegrityError:
#             # Already exists, don't save again.
#             pass
#     logger.debug('Created Cards in %s s' % (time.time() - start))
#     return response({'num_cards': Card.objects.filter(
#                      user=request.user).count()
#                      })


# @login_required
# def get_scheduled_cards(request):
#     """
#         Gets scheduled cards 100 at a time.
#     """
#     now = datetime.today()
#     # TODO lexicon
#     cards = Card.objects.filter(
#         user=request.user, next_scheduled__lte=now)[:100]
#     # Front end should take care of randomizing this.

