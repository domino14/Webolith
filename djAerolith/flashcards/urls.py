from django.conf.urls.defaults import *

urlpatterns = patterns('',
    url(r'^$', 'flashcards.views.create_quiz', name='create_quiz'),
    url(r'^api/load$', 'flashcards.views.load_cards'),
    url(r'^api/scheduled$', 'flashcards.views.get_scheduled_cards')
)
