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


from django.contrib.auth.decorators import login_required
from base.models import SavedList, Lexicon
from lib.response import response
import base.settings
import json
import logging
import time
from base.utils import generate_question_map
logger = logging.getLogger(__name__)


@login_required
def saved_list_sync(request):
    """
    Accept a POST of a new saved list.
    """
    if request.method != 'POST':
        return response('This endpoint only accepts a POST.', status=400)
    body = json.loads(request.body)
    profile = request.user.aerolithprofile
    saved_alphas = profile.wordwallsSaveListSize
    limit = base.settings.SAVE_LIST_LIMIT_NONMEMBER
    logger.debug('Syncing %s' % body)
    orig_qs = body.get('origQuestions')
    # Try getting a saved list with the same name, lexicon, and user.
    sl = SavedList.objects.filter(user=request.user,
                                  lexicon__lexiconName=body.get('lexicon'),
                                  name=body.get('name'))
    if len(sl):
        return response('A list by that name already exists. Please remove '
                        'that saved list and try again.', status=400)

    sl = SavedList()
    sl.user = request.user
    sl.lexicon = Lexicon.objects.get(lexiconName=body.get('lexicon'))
    sl.name = body.get('name')
    if (saved_alphas + len(orig_qs)) > limit and not profile.member:
        return response(
            'This list would exceed your total list size limit. You can '
            'remove this limit by upgrading your membership!',
            status=400)
    sl.numAlphagrams = body.get('numAlphagrams')
    sl.numCurAlphagrams = body.get('numCurAlphagrams')
    sl.numFirstMissed = body.get('numFirstMissed')
    sl.numMissed = body.get('numMissed')
    sl.goneThruOnce = body.get('goneThruOnce')
    sl.questionIndex = body.get('questionIndex')
    sl.origQuestions = json.dumps(orig_qs)
    sl.curQuestions = json.dumps(body.get('curQuestions'))
    sl.missed = json.dumps(body.get('missed'))
    sl.firstMissed = json.dumps(body.get('firstMissed'))

    sl.save()
    profile.wordwallsSaveListSize += len(orig_qs)
    profile.save()
    return response(sl.to_python())


@login_required
def saved_list(request, id):
    try:
        sl = SavedList.objects.get(user=request.user,
                                   id=id)
    except SavedList.DoesNotExist:
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
            # The user sync will take care of any saves.
            l_obj['questionIndex'] = 0
            l_obj['curQuestions'] = l_obj['firstMissed']
            l_obj['numCurAlphagrams'] = l_obj['numFirstMissed']
            l_obj['numMissed'] = 0
            l_obj['missed'] = []
        elif action == 'reset':
            l_obj = sl.to_python()
            # Again, reset will not actually save, so this is a GET. Sync takes
            # care of saving.
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
    """
    body = json.loads(request.body)
    orig_qs = body.get('origQuestions')
    if sl.numAlphagrams != body.get('numAlphagrams'):
        return response('The alphagrams for this list do not match.',
                        status=400)
    sl.numCurAlphagrams = body.get('numCurAlphagrams')
    sl.numFirstMissed = body.get('numFirstMissed')
    sl.numMissed = body.get('numMissed')
    sl.goneThruOnce = body.get('goneThruOnce')
    sl.questionIndex = body.get('questionIndex')
    sl.origQuestions = json.dumps(orig_qs)
    sl.curQuestions = json.dumps(body.get('curQuestions'))
    sl.missed = json.dumps(body.get('missed'))
    sl.firstMissed = json.dumps(body.get('firstMissed'))
    sl.save()
    return response(sl.to_python())


@login_required
def question_map(request):
    if request.method != 'GET':
        return response('This endpoint only accepts GET', status=400)
    try:
        sl = SavedList.objects.get(user=request.user,
                                   id=request.GET.get('listId'))
    except SavedList.DoesNotExist:
        return response('This list does not exist!', status=404)

    qs = json.loads(sl.origQuestions)
    t1 = time.time()
    logger.debug('Generating question map for %s questions.' % len(qs))
    map = generate_question_map(qs)
    logger.debug('Map generated, returning. Time: %s s.' % (time.time() - t1))
    return response(map)
