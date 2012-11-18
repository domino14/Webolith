# Create your views here.
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.contrib.auth.decorators import login_required
from crosswordgame.forms import GCGForm
from django.http import HttpResponseRedirect, Http404
from crosswordgame.gcg_parser import GCGParser, GCGParseError
from crosswordgame.models import CrosswordGameFile
import json

GCG_FILE_SIZE_LIMIT = 2 ** 14     # ~16K. why would it ever be this big even?


def upload(request):
    if request.method == 'POST':
        if len(request.FILES) == 1:
            form = GCGForm(request.POST, request.FILES)
            if form.is_valid():
                success, msg = handle_uploaded_gcg(request.FILES['file'])
                if not success:
                    return render_to_response(
                        'crosswordgame/gcgFail.html',
                        {'errorMsg': msg},
                        context_instance=RequestContext(request))
                return render_to_response(
                    'crosswordgame/gcgSuccess.html',
                    {'url': 'http://%s/crosswords/analyze/%d' % (
                        request.get_host(), msg)},
                    context_instance=RequestContext(request))

    form = GCGForm()
    return render_to_response('crosswordgame/uploadForm.html',
                              {'gcgform': form},
                              context_instance=RequestContext(request))


def analyze(request, id):
    try:
        game = CrosswordGameFile.objects.get(pk=id)
    except CrosswordGameFile.DoesNotExist:
        raise Http404
    return render_to_response('crosswordgame/analyze.html',
                              {'gamejson': game.parsedDump},
                              context_instance=RequestContext(request))


def handle_uploaded_gcg(f):
    if f.size > GCG_FILE_SIZE_LIMIT:
        return False, 'Your .gcg file is too big'

    fStr = f.read()
    parser = GCGParser()
    success = True
    try:
        output = parser.parse(fStr)
    except GCGParseError as e:
        success = False
        msg = str(e)

    if not success:
        return False, msg

    gcg = CrosswordGameFile()
    gcg.parsedDump = json.dumps(output)
    gcg.org_id = output['id']
    gcg.save()

    return True, gcg.pk
