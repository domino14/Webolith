from django.conf.urls.defaults import patterns, url


urlpatterns = patterns('',
    url(r'^api/saved_list$', 'base.views.saved_list')
)