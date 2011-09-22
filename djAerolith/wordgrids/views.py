from django.middleware.csrf import get_token
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.contrib.auth.decorators import login_required

from wordwalls.forms import LexiconForm
from wordgrids.game import WordgridsGame
from base.models import Lexicon
from django.http import HttpResponseRedirect, HttpResponse
from django.core.urlresolvers import reverse
import json
from wordgrids.models import WordgridsTable

@login_required
def homepage(request):    
    
    lexForm = LexiconForm()
    profile = request.user.get_profile()
    print "request:", request.method

    if request.method == 'POST':
        action = request.POST['action']
        print action
        
        if action == "multiWordStruck":
            lexForm = LexiconForm(request.POST)
            
            if lexForm.is_valid():
                lex = Lexicon.objects.get(lexiconName=lexForm.cleaned_data['lexicon'])
                wgg = WordgridsGame()                    
                tablenum = wgg.initializeByChallenge(request.POST['challenge'], lex, request.user)
                if tablenum == 0:
                    raise Http404
                else:
                    response = HttpResponse(json.dumps(
                                                        {'url': reverse('wordgrids_table', args=(tablenum,)),
                                                        'success': True}
                                                        ),
                                                        mimetype="application/javascript")
                    response['Content-Type'] = 'text/plain; charset=utf-8'
                    return response

            
    ctx = RequestContext( request, {
      'csrf_token': get_token( request ),
    } )

    return render_to_response('wordgrids/index.html',
                            {'lexForm' : lexForm,
                             'defaultLexicon': profile.defaultLexicon,
                            },
                            context_instance=ctx)
@login_required
def table(request, id):
    ctx = RequestContext( request, {
      'csrf_token': get_token( request ),
    } )
    return render_to_response('wordgrids/table.html', 
                                        {'tablenum': id,
                                          'username': request.user.username,
                                          'grid': WordgridsTable.objects.get(pk=id).currentGrid}, 
                                        context_instance=ctx)