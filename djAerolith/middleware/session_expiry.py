import datetime

from django.contrib.auth import logout
from django.conf import settings


class SessionIdleTimeout:
    """
    Middleware class to timeout a session after a specified time period.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Timeout is done only for authenticated logged in users.
        if request.user.is_authenticated:
            current_datetime = datetime.datetime.now()
            # Timeout if idle time period is exceeded.
            if ('last_activity' in request.session and
                (current_datetime - request.session['last_activity']).seconds >
                    settings.SESSION_IDLE_TIMEOUT):
                logout(request)
            # Set last activity time in current session.
            else:
                request.session['last_activity'] = current_datetime

        response = self.get_response(request)
        return response
