from django.conf.urls.defaults import *
from django.views.generic.simple import direct_to_template


urlpatterns = patterns('',
    url(r'^$', direct_to_template, {'template': 'crosswordgame/index.html'}),
    url(r'^upload$', 'crosswordgame.views.upload'),
    url(r'^analyze/(?P<id>\d+)/$', 'crosswordgame.views.analyze')

    )