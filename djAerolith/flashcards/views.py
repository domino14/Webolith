import logging
import json

from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from django.conf import settings

from current_version import CURRENT_VERSION
from base.models import Lexicon, WordList
from base.utils import savedlist_from_probabilities, quizzes_response
from lib.response import response

logger = logging.getLogger(__name__)


@login_required
def main(request):
    quizzes = WordList.objects.filter(user=request.user, is_temporary=False)
    return render(request, "flashcards/index.html", {
                  'numCards': 0,
                  'savedLists': json.dumps(quizzes_response(
                                           quizzes)),
                  'CURRENT_VERSION': CURRENT_VERSION,
                  'STATIC_SRV': (
                      settings.WEBPACK_DEV_SERVER_URL if (
                          settings.USE_WEBPACK_DEV_SERVER and settings.DEBUG)
                      else '')
                  })


def validate_params(min, max, length, lex):
    """
        Validates string parameters min, max, length with lexicon.
        :min - Minimum probability
        :max-  Maximum probability
        :length - Length of word
        :lex - Lexicon short name (string)
    """
    try:
        lexicon = Lexicon.objects.get(lexiconName=lex)
    except Lexicon.DoesNotExist:
        return "No such lexicon: %s" % lex
    try:
        p_min = int(min)
        p_max = int(max)
        length = int(length)
    except (ValueError, TypeError):
        return "Probabilities and lengths must be integers."
    if p_min > p_max:
        return "Max probability must be bigger than min."
    if length < 2 or length > 15:
        return "Length should be between 2 and 15."
    if p_max - p_min + 1 > 1000:
        return "You can only fetch 1000 questions at most."

    count = json.loads(lexicon.lengthCounts).get('%s' % length, 0)

    if p_min < 1 or p_min > count:
        return (
            'Minimum probability must be between 1 and %s for %s-letter '
            'words' % (count, length))
    if p_max < 1 or p_max > count:
        return (
            'Maximum probability must be between 1 and %s for %s-letter '
            'words' % (count, length))
    return p_min, p_max, length, lexicon


@login_required
def new_quiz(request):
    """
    Create a new quiz but doesn't create any 'card' models.
    Card models will only be used for cardbox in future.
    """
    body = json.loads(request.body)
    params = validate_params(body['min'], body['max'], body['length'],
                             body['lex'])
    if isinstance(params, basestring):
        return response(params, status=400)
    p_min, p_max, length, lexicon = params

    li, q_map = savedlist_from_probabilities(lexicon, p_min, p_max, length)
    if len(q_map) > 0:
        # Generate a quiz name.
        quiz_name = '{} {}s ({} to {})'.format(lexicon.lexiconName, length,
                                               p_min, p_max)
    else:
        quiz_name = ''
    return response({'list': li.to_python(),
                     'q_map': q_map,
                     'quiz_name': quiz_name})


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

