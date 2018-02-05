# Aerolith 2.0: A web-based word game website
# Copyright (C) 2011 Cesar Del Solar
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

# To contact the author, please email delsolar at gmail dot com

import logging
import json
import jwt
import time

from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.core.mail import send_mail
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt

from lib.response import response, StatusCode

logger = logging.getLogger(__name__)
JWT_EXPIRATION = 60 * 60 * 6  # 6 hours


def health(request):
    # HAProxy health request
    if request.method != 'OPTIONS':
        return response('Bad method.', StatusCode.BAD_REQUEST)
    return response('OK')


def trigger500(request):
    logger.info('Triggering 500 for request user: %s', request.user)
    raise Exception('OH NO')


def login_error(request):
    return render(request, 'login_error.html')


def new_social_user(request):
    return render(request, 'new_social_user.html')


@login_required
def js_error(request):
    err = json.loads(request.body)

    if not settings.DEBUG:
        send_mail(
            'User {0} encountered JS error: {1}'.format(
                request.user, err['fe_message']),
            json.dumps(err, indent=2),
            'root@aerolith',
            [admin[1] for admin in settings.ADMINS]
        )
    else:
        # Send a "fake" email - just log.
        logger.debug('Fake email:')
        logger.debug('Subject: User %s encountered JS error: %s',
                     request.user, err['fe_message'])
        logger.debug('Body: %s', json.dumps(err, indent=2))
        logger.debug('From: root@aerolith')
        logger.debug('To: %s', [admin[1] for admin in settings.ADMINS])

    return response('OK')


@login_required
def test_500(request):
    raise Exception('A test 500')


@csrf_exempt
def healthz(request):
    if request.method == 'OPTIONS':
        return response('OK')
    if request.method == 'GET':
        return response('OK')
    elif request.method == 'POST':
        return response('OKPOST')
    return response('Bad method.', StatusCode.BAD_REQUEST)


def jwt_req(request):
    if not request.user.is_authenticated():
        return response({
            'error': 'Must log in',
        }, status=StatusCode.FORBIDDEN)
    token = jwt.encode({
        'iss': 'aerolith.org',
        'sub': request.user.pk,
        'usn': request.user.username,
        'exp': int(time.time()) + JWT_EXPIRATION
    }, settings.SECRET_KEY, algorithm='HS256')
    return response({
        'token': token.decode('utf-8'),
    })
