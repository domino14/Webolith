from django.conf.urls.defaults import *

urlpatterns = patterns('',
    url(r'^$', 'whitleyCards.views.createQuiz', name='flashcards_create_quiz'),
    url(r'^ppk/(?P<minP>\d+)_(?P<maxP>\d+)/$', 'whitleyCards.views.probPkRange', name='flashcards_by_prob_pk_range'),    
)
    