from django.conf.urls.defaults import *

urlpatterns = patterns('',
    url(r'^$', 'flashcards.views.main'),
    url(r'^api/load$', 'flashcards.views.load_into_cardbox'),
    url(r'^api/new_quiz$', 'flashcards.views.new_quiz'),
    url(r'^api/scheduled$', 'flashcards.views.get_scheduled_cards')
)
