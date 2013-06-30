from django.conf.urls.defaults import patterns, url

urlpatterns = patterns(
    '',
    url(r'^$', 'futures.views.main'),
    url(r'api/futures/$', 'futures.views.futures'),
    url(r'api/wallet/$', 'futures.views.wallet'),
    url(r'api/orders/$', 'futures.views.orders')
)
