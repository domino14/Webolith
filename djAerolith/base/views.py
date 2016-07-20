# Aerolith 2.0: A web-based word game website
# Copyright (C) 2011 Cesar Del Solar
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

# To contact the author, please email delsolar at gmail dot com

# Create your views here.

import json
import logging
import time

from django.contrib.auth.decorators import login_required
from django.core.exceptions import ValidationError
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render

from base.models import WordList, Lexicon
from lib.response import response, StatusCode
from lib.macondo_interface import anagram_letters
from base.utils import (generate_question_map_from_alphagrams,
                        generate_question_list_from_alphagrams,
                        question_list_from_probabilities)

logger = logging.getLogger(__name__)


@login_required
def saved_list_sync(request):
    """
    Accept a POST of a NEW saved list.
    """
    if request.method != 'POST':
        return response('This endpoint only accepts a POST.', status=400)
    body = json.loads(request.body)
    profile = request.user.aerolithprofile
    num_saved_alphas = profile.wordwallsSaveListSize
    limit = settings.SAVE_LIST_LIMIT_NONMEMBER
    logger.debug('Syncing %s' % body)
    orig_qs = body.get('origQuestions')

    # Try getting a saved list with the same name, lexicon, and user.
    sl = WordList.objects.filter(user=request.user,
                                 lexicon__lexiconName=body.get('lexicon'),
                                 name=body.get('name'))
    if len(sl):
        return response('A list by that name already exists. Please remove '
                        'that saved list and try again.', status=400)

    if (num_saved_alphas + len(orig_qs)) > limit and not profile.member:
        return response(
            'This list would exceed your total list size limit. You can '
            'remove this limit by upgrading your membership!',
            status=400)

    sl = WordList(
        user=request.user,
        lexicon=Lexicon.objects.get(lexiconName=body.get('lexicon')),
        name=body.get('name'),
        numAlphagrams=body.get('numAlphagrams'),
        numCurAlphagrams=body.get('numCurAlphagrams'),
        numFirstMissed=body.get('numFirstMissed'),
        numMissed=body.get('numMissed'),
        goneThruOnce=body.get('goneThruOnce'),
        questionIndex=body.get('questionIndex'),
        origQuestions=json.dumps(orig_qs),
        curQuestions=json.dumps(body.get('curQuestions')),
        missed=json.dumps(body.get('missed')),
        firstMissed=json.dumps(body.get('firstMissed')),
        is_temporary=False,
        version=2
    )
    try:
        sl.full_clean()
    except ValidationError as e:
        return response('Your saved list is improperly formatted: %s', e)
    sl.save()
    profile.wordwallsSaveListSize += len(orig_qs)
    profile.save()
    return response(sl.to_python())


@login_required
def saved_lists(request):
    if request.method == 'GET':
        return saved_lists_get(request)
    elif request.method == 'DELETE':
        return saved_lists_delete(request)


def saved_lists_get(request):
    query_params = request.GET
    qargs = {'user': request.user}
    lexicon = query_params.get('lexicon')
    temporary = query_params.get('temp')
    if lexicon:
        qargs['lexicon__lexiconName'] = lexicon
    if temporary:
        qargs['is_temporary'] = temporary == '1'
    lists = WordList.objects.filter(**qargs)
    return response({'lists': [sl.to_python_reduced() for sl in lists],
                     'count': lists.count()})


def saved_lists_delete(request):
    list_ids = json.loads(request.body)
    sls = []
    for l in list_ids:
        try:
            sls.append(WordList.objects.get(user=request.user, id=l))
        except WordList.DoesNotExist:
            return response('List id %s was not found.' % l, status=404)
    profile = request.user.aerolithprofile
    for l in sls:
        profile.wordwallsSaveListSize -= l.numAlphagrams
        l.delete()
    profile.save()
    return response('OK')


@login_required
def saved_list(request, id):
    try:
        sl = WordList.objects.get(user=request.user, id=id)
    except WordList.DoesNotExist:
        return response('This list does not exist on the server!', status=404)
    if request.method == 'DELETE':
        profile = request.user.aerolithprofile
        saved_alphas = profile.wordwallsSaveListSize
        profile.wordwallsSaveListSize = saved_alphas - sl.numAlphagrams
        sl.delete()
        profile.save()
        return response('OK')
    elif request.method == 'GET':
        # Check 'action'.
        action = request.GET.get('action')
        l_obj = sl.to_python()
        if action == 'continue':
            pass
        elif action == 'firstmissed':
            l_obj = sl.to_python()
            if l_obj['goneThruOnce'] is False:
                return response('Cannot quiz on first missed unless you have '
                                'gone through the entire quiz.', status=400)
            # Reset the list object to first missed but don't actually save it.
            # The user sync or PUT will take care of any saves.
            l_obj['questionIndex'] = 0
            l_obj['curQuestions'] = l_obj['firstMissed']
            l_obj['numCurAlphagrams'] = l_obj['numFirstMissed']
            l_obj['numMissed'] = 0
            l_obj['missed'] = []
        elif action == 'reset':
            l_obj = sl.to_python()
            # Again, reset will not actually save, so this is a GET.
            # Sync or PUT take care of saving.
            l_obj['questionIndex'] = 0
            l_obj['curQuestions'] = range(l_obj['numAlphagrams'])
            l_obj['numCurAlphagrams'] = l_obj['numAlphagrams']
            l_obj['firstMissed'] = []
            l_obj['numFirstMissed'] = 0
            l_obj['missed'] = []
            l_obj['numMissed'] = 0
            l_obj['goneThruOnce'] = False
        logger.debug('Returning response %s' % l_obj)
        return response(l_obj)
    elif request.method == 'PUT':
        # Edit a saved list.
        return edit_saved_list(request, sl)


def edit_saved_list(request, sl):
    """
    A helper function (not a view) that saves an already existing list
    with new data and returns an HTTP response.

    Note: We do not save the original alphagrams here. These should be
    assumed to never change after an initial sync.

    """
    body = json.loads(request.body)
    if sl.numAlphagrams != body.get('numAlphagrams'):
        return response('The alphagrams for this list do not match.',
                        status=400)
    sl.numCurAlphagrams = body.get('numCurAlphagrams')
    sl.numFirstMissed = body.get('numFirstMissed')
    sl.numMissed = body.get('numMissed')
    sl.goneThruOnce = body.get('goneThruOnce')
    sl.questionIndex = body.get('questionIndex')
    sl.curQuestions = json.dumps(body.get('curQuestions'))
    sl.missed = json.dumps(body.get('missed'))
    sl.firstMissed = json.dumps(body.get('firstMissed'))
    try:
        sl.full_clean()
    except ValidationError as e:
        return response(str(e), status=400)
    sl.save()
    return response(sl.to_python())


@login_required
def question_map(request):
    """
    Stand-alone endpoint for loading a question map. This is usually
    called after the user makes a request to load a remote quiz.

    XXX: Maybe should not be two endpoints. See new_quiz in flashcards.views

    """
    if request.method != 'GET':
        return response('This endpoint only accepts GET', status=400)
    try:
        sl = WordList.objects.get(user=request.user,
                                  id=request.GET.get('listId'))
    except WordList.DoesNotExist:
        return response('This list does not exist!', status=404)

    t1 = time.time()
    q_map = generate_question_map_from_alphagrams(sl.lexicon,
                                                  json.loads(sl.origQuestions))
    logger.debug('Map generated, returning. Time: %s s.' % (time.time() - t1))
    return response(q_map)


@csrf_exempt
def list_questions_view(request):
    """
    Get list of questions - `get_questions_from_alph_dicts` as an API view.

    Use POST since GET should not accept a request body in the standard.

    """
    if request.method != 'POST':
        return response('Must use POST', StatusCode.BAD_REQUEST)
    body = json.loads(request.body)
    lexicon_name = body['lexicon']
    questions = body['questions']
    try:
        lex = Lexicon.objects.get(lexiconName=lexicon_name)
    except Lexicon.DoesNotExist:
        return response('Bad Lexicon', StatusCode.BAD_REQUEST)
    return response(generate_question_list_from_alphagrams(lex, questions))


@csrf_exempt
def questions_for_prob_range(request):
    """ Get a list of questions for a probability range. """
    if request.method != 'POST':
        return response('Must use POST', StatusCode.BAD_REQUEST)
    body = json.loads(request.body)
    lexicon_name = body['lexicon']
    pmin = body['pmin']
    pmax = body['pmax']
    length = body['length']
    try:
        lex = Lexicon.objects.get(lexiconName=lexicon_name)
    except Lexicon.DoesNotExist:
        return response('Bad Lexicon', StatusCode.BAD_REQUEST)
    return response(question_list_from_probabilities(lex, pmin, pmax, length))


@login_required
def listmanager(request):
    return render(request, 'listmanager.html')


@login_required
def word_lookup(request):
    lexicon = request.GET.get('lexicon')
    letters = request.GET.get('letters')
    results = anagram_letters(lexicon, letters)
    return response(results)
