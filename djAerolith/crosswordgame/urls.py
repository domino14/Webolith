from django.conf.urls.defaults import *

urlpatterns = patterns('',
    url(r'^$', 'crosswordgame.views.homepage', name='crosswordgame_create_table'),
    #url(r'^table/(?P<id>\d+)/$', 'crosswordgame.views.table', name='crosswordgame_table')
    
    )