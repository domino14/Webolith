# Create your views here.
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.contrib.auth.decorators import login_required


def homepage(request):
    return render_to_response('crosswordgame/index.html',
                              {'username': request.user.username},
                              context_instance=RequestContext(request))
