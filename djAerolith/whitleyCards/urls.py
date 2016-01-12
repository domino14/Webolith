from django.conf.urls import *

urlpatterns = patterns('',
    url(r'^$', 'whitleyCards.views.createQuiz', name='flashcards_create_quiz'),
    url(r'^probs/(?P<lexid>\d+)/(?P<length>\d+)/(?P<minP>\d+)_(?P<maxP>\d+)/$',
        'whitleyCards.views.prob_range', name='flashcards_by_prob_range'),
    url(r'^nlpk/(?P<nlpk>\d+)/$', 'whitleyCards.views.namedListPk',
        name='flashcards_by_namedList_pk'),
    url(r'^slpk/(?P<slpk>\d+)_(?P<option>\d+)/$',
        'whitleyCards.views.savedListPk', name='flashcards_by_savedList_pk'),
)
