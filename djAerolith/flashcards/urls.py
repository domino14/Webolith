from django.conf.urls.defaults import *

urlpatterns = patterns('',
    url(r'^$', 'flashcards.views.create_quiz', name='create_quiz'),
)
