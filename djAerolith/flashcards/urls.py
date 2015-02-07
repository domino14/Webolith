from django.conf.urls.defaults import patterns, url


urlpatterns = patterns(
    '',
    url(r'^$', 'flashcards.views.main'),
    url(r'^api/new_quiz$', 'flashcards.views.new_quiz'),
)
