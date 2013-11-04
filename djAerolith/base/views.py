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
from base.utils import generate_question_map
logger = logging.getLogger(__name__)


@login_required
def saved_list_sync(request):
    body = json.loads(request.raw_post_data)
    replacing = False
    profile = request.user.get_profile()
    saved_alphas = profile.wordwallsSaveListSize
    limit = base.settings.SAVE_LIST_LIMIT_NONMEMBER
    orig_qs = body.get('origQuestions')
    # Try getting a saved list with the same name, lexicon, and user.
    try:
        sl = SavedList.objects.get(user=request.user,
                                   lexicon__lexiconName=body.get('lexicon'),
                                   name=body.get('name'))
        replacing = True
    except SavedList.DoesNotExist:
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
    if replacing:
        resp_text = ('Found a list with name "%s" for lexicon %s, '
                     'replaced.' % (sl.name, sl.lexicon))
    else:
        resp_text = 'Saving a new list with name "%s" for lexicon %s' % (
            sl.name, sl.lexicon)
        profile.wordwallsSaveListSize += len(orig_qs)
        profile.save()
    return response(resp_text)


@login_required
def saved_list(request, id):
    try:
        sl = SavedList.objects.get(user=request.user,
                                   id=id)
    except SavedList.DoesNotExist:
        return response('This list does not exist!', status=404)
    if request.method == 'DELETE':
        sl.delete()
        return response('OK')
    elif request.method == 'GET':
        # Check 'action'.
        action = request.GET.get('action')
        if action == 'continue':
            return response(sl.to_python())
    elif request.method == 'POST':
        # Check 'action'.
        action = request.POST.get('action')
        if action == 'firstmissed':
            pass # XXX: fix
        elif action == 'reset':
            pass


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
    logger.debug('Generating question map for %s questions.' % len(qs))
    map = generate_question_map(qs)
    logger.debug('Map generated, returning.')
    return response(map)