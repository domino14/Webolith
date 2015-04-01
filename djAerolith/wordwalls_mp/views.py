from django.shortcuts import render
from base.forms import NamedListForm
from django.contrib.auth.decorators import login_required
from firebase_token_generator import create_token
from django.conf import settings
import logging
logger = logging.getLogger(__name__)


@login_required
def main(request):
    nl_form = NamedListForm()
    auth_payload = {
        'uid': '%s' % request.user.id,
        'username': request.user.username
    }
    token = create_token(settings.FIREBASE_SECRET_TOKEN, auth_payload)
    logger.debug('Token was created for user %s: %s' % (request.user.username,
                                                        token))
    return render(request, "wordwalls_mp/index.html", {
                  'firebaseToken': token,
                  'firebaseURL': settings.FIREBASE_URL,
                  'nlForm': nl_form
                  })
