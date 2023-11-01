from django.urls import re_path

from whitleyCards.views import createQuiz, search, namedListPk, savedListPk

urlpatterns = [
    re_path(r"^$", createQuiz, name="flashcards_create_quiz"),
    re_path(
        r"^search/(?P<lex_id>\d+)/(?P<paramsb64>[0-9A-Za-z_\-=]+)/$",
        search,
        name="flashcards_by_search",
    ),
    re_path(r"^nlpk/(?P<nlpk>\d+)/$", namedListPk, name="flashcards_by_namedList_pk"),
    re_path(
        r"^slpk/(?P<slpk>\d+)_(?P<option>\d+)/$",
        savedListPk,
        name="flashcards_by_savedList_pk",
    ),
]
