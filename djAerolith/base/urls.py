from django.urls import re_path

from base.views import (
    saved_lists,
    saved_list_sync,
    saved_list,
    question_map,
    list_questions_view,
    questions_for_prob_range,
    word_lookup,
)

urlpatterns = [
    re_path(r"^api/saved_lists/$", saved_lists),
    re_path(r"^api/saved_list$", saved_list_sync),
    re_path(r"^api/saved_list/(?P<id>\d+)$", saved_list),
    re_path(r"^api/question_map/$", question_map),
    re_path(r"^api/word_db/full_questions/$", list_questions_view),
    re_path(r"^api/word_db/questions_prob_range/$", questions_for_prob_range),
    re_path(r"^api/word_lookup$", word_lookup),
]
