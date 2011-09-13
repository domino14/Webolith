from django.middleware.csrf import get_token
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.contrib.auth.decorators import login_required

from wordwalls.forms import LexiconForm
@login_required
def homepage(request):    
    lexForm = LexiconForm()
    profile = request.user.get_profile()
    
    ctx = RequestContext( request, {
      'csrf_token': get_token( request ),
    } )

    return render_to_response('wordgrids/index.html',
                            {'lexForm' : lexForm,
                             'defaultLexicon': profile.defaultLexicon,
                              
                            },
                            context_instance=ctx)

