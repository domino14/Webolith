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
from django.contrib.auth.decorators import login_required


@login_required
def main(request):
    user_cards = Card.objects.filter(user=request.user)
    num_cards = user_cards.count()
    return render_to_response("flashcards/index.html", {
                              'numCards': num_cards,
                              'CURRENT_VERSION': CURRENT_VERSION,
                              },
                              context_instance=RequestContext(request))


def to_python(alphagram):
    """
        Converts the alphagram model instance to a Python object.
    """
    return {
        'question': alphagram.alphagram,
        'probability': alphagram.probability,
        'id': alphagram.probability_pk,
        'answers': [{
            'word': word.word,
            'def': word.definition,
            'f_hooks': word.front_hooks,
            'b_hooks': word.back_hooks,
            'symbols': word.lexiconSymbols
        } for word in alphagram.word_set.all()]
    }


@login_required
def new_quiz(request):
    """
        Creates a new quiz but doesn't create any 'card' models.
        Card models will only be used for cardbox in future.
    """
    body = json.loads(request.raw_post_data)
    lexicon = Lexicon.objects.get(lexiconName=body['lex'].upper())
    try:
        p_min = int(body['min'])
        p_max = int(body['max'])
        length = int(body['length'])
    except (ValueError, TypeError):
        return response({'questions': []})

    min_pk = alphProbToProbPK(p_min, lexicon.pk, length)
    max_pk = alphProbToProbPK(p_max, lexicon.pk, length)
    alphs = Alphagram.objects.filter(probability_pk__gte=min_pk,
                                     probability_pk__lte=max_pk)
    questions = [to_python(alph) for alph in alphs]
    if len(questions) > 0:
        # Generate a quiz name.
        quiz_name = '%s %ss (%s to %s)' % (lexicon.lexiconName, length,
                                           questions[0]['probability'],
                                           questions[-1]['probability'])
    else:
        quiz_name = ''
    return response({'questions': questions,
                     'quiz_name': quiz_name})


@login_required
def load_into_cardbox(request):
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


@login_required
def get_scheduled_cards(request):
    """
        Gets scheduled cards 100 at a time.
    """
    now = datetime.today()
    # TODO lexicon
    cards = Card.objects.filter(
        user=request.user, next_scheduled__lte=now)[:100]
    # Front end should take care of randomizing this.

