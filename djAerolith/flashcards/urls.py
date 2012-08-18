from django.conf.urls.defaults import *

urlpatterns = patterns(
    '',
    url(r'^ikm/$', 'flashcards.views.ikm'),
    url(r'^$', 'flashcards.views.createQuiz', name='flashcards_create_quiz'),
    url(r'^ppk/(?P<minP>\d+)_(?P<maxP>\d+)/$',
        'flashcards.views.probPkRange', name='flashcards_by_prob_pk_range'),
    url(r'^nlpk/(?P<nlpk>\d+)/$',
        'flashcards.views.namedListPk', name='flashcards_by_namedList_pk'),
    url(r'^slpk/(?P<slpk>\d+)_(?P<option>\d+)/$',
        'flashcards.views.savedListPk', name='flashcards_by_savedList_pk'),
)
