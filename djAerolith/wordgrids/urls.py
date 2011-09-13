from django.conf.urls.defaults import *

urlpatterns = patterns('',
    url(r'^$', 'wordgrids.views.homepage', name='wordgrids_create_table'),
    url(r'^table/(?P<id>\d+)/$', 'wordgrids.views.table', name='wordgrids_table')
    #url(r'^table/(?P<id>\d+)/$', 'wordwalls.views.table', name='wordwalls_table'),
    #url(r'^ajax_upload/$', 'wordwalls.views.ajax_upload', name='ajax_upload' ),
    
    )