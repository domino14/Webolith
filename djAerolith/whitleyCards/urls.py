from django.conf.urls import url

from whitleyCards.views import createQuiz, search, namedListPk, savedListPk

urlpatterns = [
    url(r'^$', createQuiz, name='flashcards_create_quiz'),
    url(r'^search/(?P<lex_id>\d+)/(?P<paramsb64>[0-9A-Za-z_\-=]+)/$',
        search, name='flashcards_by_search'),
    url(r'^nlpk/(?P<nlpk>\d+)/$', namedListPk,
        name='flashcards_by_namedList_pk'),
    url(r'^slpk/(?P<slpk>\d+)_(?P<option>\d+)/$',
        savedListPk, name='flashcards_by_savedList_pk'),
]
