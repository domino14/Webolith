from lib.response import response
from django.db import IntegrityError
from django.shortcuts import render_to_response
from django.template import RequestContext
from current_version import CURRENT_VERSION
from flashcards.models import Card
import json
from datetime import datetime
from base.models import Lexicon, Alphagram, alphProbToProbPK
import time
import logging
logger = logging.getLogger(__name__)


def create_quiz(request):
    user_cards = Card.objects.filter(user=request.user)
    num_cards = user_cards.count()
    return render_to_response("flashcards/index.html", {
                              'numCards': num_cards,
                              'CURRENT_VERSION': CURRENT_VERSION,
                              },
                              context_instance=RequestContext(request))


def load_cards(request):
    body = json.loads(request.raw_post_data)
    lexicon = Lexicon.objects.get(lexiconName=body['lex'].upper())
    min_pk = alphProbToProbPK(int(body['min']), lexicon.pk,
                              int(body['length']))
    max_pk = alphProbToProbPK(int(body['max']), lexicon.pk,
                              int(body['length']))
    rg = range(min_pk, max_pk + 1)
    # For every alphagram, see if we already have a card for this user,
    # if not, create it.
    user_cards = Card.objects.filter(user=request.user)
    start = time.time()
    now = datetime.today()
    for ppk in rg:
        # Create a new card.
        try:
            card = Card(alphagram=Alphagram.objects.get(probability_pk=ppk),
                        user=request.user, next_scheduled=now)
        except Alphagram.DoesNotExist:
            continue
        try:
            card.save()
        except IntegrityError:
            # Already exists, don't save again.
            pass
    logger.debug('Created Cards in %s s' % (time.time() - start))
    return response({'num_cards': Card.objects.filter(
                     user=request.user).count()
                     })


def get_scheduled_cards(request):
    """
        Gets scheduled cards 100 at a time.
    """
    now = datetime.today()
    # TODO lexicon
    cards = Card.objects.filter(
        user=request.user, next_scheduled__lte=now)[:100]
    # Front end should take care of randomizing this.

