from django.conf.urls.defaults import patterns, url


urlpatterns = patterns('',
    url(r'^api/saved_list/sync/$', 'base.views.saved_list_sync'),
    url(r'^api/saved_list/(?P<id>\d+)/$', 'base.views.saved_list')
)