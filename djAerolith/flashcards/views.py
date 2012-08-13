from django.shortcuts import render_to_response
from django.template import RequestContext
from flashcards.models import Question
from wordwalls.forms import LexiconForm

def mainview(request):
    lexForm = LexiconForm()

    questionCount = Question.objects.filter(user=request.user).count()

    return render_to_response("flashcards/index.html",
                              {'questionCount': questionCount,
                               'lexForm': lexForm},
                              context_instance=RequestContext(request))
