import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "djaerolith.settings")

# This application object is used by the development server
# as well as any WSGI server configured to use this file.
from django.core.wsgi import get_wsgi_application

application = get_wsgi_application()


def _warm_up():
    """
    Import the URLconf, and with it every view module, now rather than on the
    first request. gunicorn preloads this module in the master (gunicorn.py),
    so the workers it forks inherit all of it.
    """
    from django.db import connections
    from django.urls import get_resolver

    get_resolver().url_patterns
    # Nothing above should touch the database, but a connection opened in the
    # master would be shared by every forked worker, so make sure there is none.
    connections.close_all()


_warm_up()
