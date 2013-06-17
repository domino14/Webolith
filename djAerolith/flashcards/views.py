from django.http import HttpResponse
from django.shortcuts import render_to_response
from django.template import RequestContext


def create_quiz(request):
    return render_to_response("flashcards/index.html", {},
                              context_instance=RequestContext(request))
