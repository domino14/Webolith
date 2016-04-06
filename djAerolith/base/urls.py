from django.conf.urls import patterns, url


urlpatterns = patterns(
    '',
    url(r'^api/saved_lists/$', 'base.views.saved_lists'),
    url(r'^api/saved_list$', 'base.views.saved_list_sync'),
    url(r'^api/saved_list/(?P<id>\d+)$', 'base.views.saved_list'),
    url(r'^api/question_map/$', 'base.views.question_map'),
    url(r'^api/word_db/full_questions/$', 'base.views.list_questions_view'),
    url(r'^api/word_db/questions_prob_range/$',
        'base.views.questions_for_prob_range'),
)
