from django.conf.urls import url

from flashcards.views import main, new_quiz

urlpatterns = [
    url(r'^$', main),
    url(r'^api/new_quiz$', new_quiz),
]
