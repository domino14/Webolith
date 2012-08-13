from django.conf.urls.defaults import *

urlpatterns = patterns('',
    url(r'^$', 'flashcards.views.mainview', name='flashcards_main_view'),
)