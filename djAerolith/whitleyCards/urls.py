from django.conf.urls import url

from whitleyCards.views import createQuiz, prob_range, namedListPk, savedListPk

urlpatterns = [
    url(r'^$', createQuiz, name='flashcards_create_quiz'),
    url(r'^probs/(?P<lexid>\d+)/(?P<length>\d+)/(?P<minP>\d+)_(?P<maxP>\d+)/$',
        prob_range, name='flashcards_by_prob_range'),
    url(r'^nlpk/(?P<nlpk>\d+)/$', namedListPk,
        name='flashcards_by_namedList_pk'),
    url(r'^slpk/(?P<slpk>\d+)_(?P<option>\d+)/$',
        savedListPk, name='flashcards_by_savedList_pk'),
]
