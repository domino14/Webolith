from django.contrib.auth.decorators import login_required
from lib.response import response
from base.models import Lexicon
from wordwalls.models import NamedList
import json
import logging
logger = logging.getLogger(__name__)


@login_required
def named_lists(request):
    if request.method != 'GET':
        return response('Forbidden', 403)
    lexicon_name = request.GET.get('lexicon')
    logger.debug('lex %s', lexicon_name)
    try:
        lex_object = Lexicon.objects.get(lexiconName=lexicon_name)
    except Lexicon.DoesNotExist:
        return response([])
    qset = NamedList.objects.filter(lexicon=lex_object).order_by('pk')
    ret_data = []
    for nl in qset:
        ret_data.append({'name': nl.name,
                         'lexicon': nl.lexicon.lexiconName,
                         'numAlphas': nl.numQuestions,
                         'id': nl.pk})
    return response(ret_data)


@login_required
def create_table(request):
    if request.method != 'POST':
        return response('Forbidden', 403)
    obj = json.loads(request.body)
    try:
        Lexicon.objects.get(lexiconName=obj['lexicon'])
    except Lexicon.DoesNotExist:
        return response({})

    if obj['listType'] == 'namedLists':
        try:
            qset = NamedList.objects.get(pk=obj['listId'])
        except NamedList.DoesNotExist:
            return response('Forbidden', 403)
        return response(qset.questions)
