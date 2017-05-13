from django.conf.urls import url

from base.views import (saved_lists, saved_list_sync, saved_list, question_map,
                        list_questions_view, questions_for_prob_range,
                        word_lookup)

urlpatterns = [
    url(r'^api/saved_lists/$', saved_lists),
    url(r'^api/saved_list$', saved_list_sync),
    url(r'^api/saved_list/(?P<id>\d+)$', saved_list),
    url(r'^api/question_map/$', question_map),
    url(r'^api/word_db/full_questions/$', list_questions_view),
    url(r'^api/word_db/questions_prob_range/$', questions_for_prob_range),
    url(r'^api/word_lookup$', word_lookup)
]
