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
import json
import logging

from django.conf import settings
from django.http import HttpResponseRedirect, Http404
from django.utils.translation import LANGUAGE_SESSION_KEY
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.shortcuts import render
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt

from accounts.models import AerolithProfile
from accounts.forms import ProfileEditForm, UsernameEditForm, MembershipForm
from accounts.payments import (PaymentError, handle_stripe_payment,
                               subscription_info, cancel_subscription,
                               handle_webhook, save_stripe_card)
from base.models import Lexicon
from lib.response import response, bad_request
from wordwalls.models import Medal

logger = logging.getLogger(__name__)
DEFAULT_LANGUAGE = 'en'


@require_POST
@login_required
def set_default_lexicon(request):
    try:
        profile = AerolithProfile.objects.get(user=request.user)
    except AerolithProfile.DoesNotExist:
        raise Http404

    body = json.loads(request.body)
    lex = body.get('defaultLexicon', -1)
    try:
        lexicon = Lexicon.objects.get(pk=lex)
    except Lexicon.DoesNotExist:
        return bad_request('Lexicon not found')
    profile.defaultLexicon = lexicon
    profile.save()
    return response('OK')


@login_required
def editProfile(request):
    try:
        profile = AerolithProfile.objects.get(user=request.user)
    except AerolithProfile.DoesNotExist:
        raise Http404

    pForm = ProfileEditForm()
    if request.method == 'POST':
        pForm = ProfileEditForm(request.POST)
        if pForm.is_valid():    # all validation rules pass
            # process data in pForm.cleaned_data
            profile.defaultLexicon = pForm.cleaned_data['defaultLexicon']
            profile.profile = pForm.cleaned_data['profileText']
            profile.additional_data = json.dumps(
                {'disableChat': pForm.cleaned_data['disableChat']})
            profile.save()
            request.session[LANGUAGE_SESSION_KEY] = pForm.cleaned_data[
                'default_language']

            return HttpResponseRedirect('/accounts/profile/%s' %
                                        profile.user.username)
    return render(
        request, 'accounts/editProfile.html',
        {'profile': profile,
         'pForm': pForm,
         'session_language': request.session.get(
             LANGUAGE_SESSION_KEY, DEFAULT_LANGUAGE)})


def calculate_medals(user):
    # Later have time selection, etc.
    medals = Medal.objects.filter(user=user)
    obj = {'medals': {}}
    # The object looks like {'medals': {'Gold': 35, ...}}
    for medal_type in Medal.MEDAL_TYPES:
        obj['medals'][medal_type[1]] = medals.filter(
            medal_type=medal_type[0]).count()
    return obj


def viewProfile(request, username):
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        raise Http404

    try:
        profile = AerolithProfile.objects.get(user=user)
    except AerolithProfile.DoesNotExist:
        raise Http404
        # although this shouldn't happen!! every user should have a profile
    return render(request, 'accounts/profile.html',
                  {'profile': profile,
                   'wwMedals': calculate_medals(user)})


@login_required
def username_change(request):
    u_form = UsernameEditForm()
    if request.method == 'POST':
        u_form = UsernameEditForm(request.POST)
        if u_form.is_valid():    # all validation rules pass
            request.user.username = u_form.cleaned_data['username']
            request.user.save()
            return HttpResponseRedirect('/accounts/username/change/done/')
    return render(
        request, 'accounts/edit_username.html',
        {'u_form': u_form})


@login_required
def new_membership(request):
    logger.info('Rendering membership form; failed invoice: %s',
                request.session.get('failed_invoice_id'))
    m_form = MembershipForm()
    stripe_error = ''
    if request.method == 'POST':
        m_form = MembershipForm(request.POST)
        if m_form.is_valid():
            try:
                handle_stripe_payment(
                    request, m_form.cleaned_data['stripe_token'],
                    request.session.get('failed_invoice_id', ''))
                request.session.pop('failed_invoice_id', None)
                return HttpResponseRedirect('/supporter/created')
            except PaymentError as e:
                logger.exception('PaymentError')
                if e.failed_invoice_id:
                    request.session['failed_invoice_id'] = e.failed_invoice_id
                stripe_error = str(e)

    return render(request, 'support.html', {
        'stripe_key': settings.STRIPE_PUBLIC_KEY,
        'stripe_error': stripe_error
    })


@login_required
def edit_card(request):
    m_form = MembershipForm()
    stripe_error = ''
    if request.method == 'POST':
        m_form = MembershipForm(request.POST)
        if m_form.is_valid():
            try:
                save_stripe_card(request, m_form.cleaned_data['stripe_token'])
                return render(request, 'updated_card.html')
            except PaymentError as e:
                logger.exception('PaymentError')
                stripe_error = str(e)

    return manage_context(request, stripe_error)


@login_required
def manage_membership(request):
    return manage_context(request)


def manage_context(request, stripe_error=''):
    sub = subscription_info(request.user)
    # check data['billing'] for charge_automatically
    automatic = False
    if sub and sub['collection_method'] == 'charge_automatically':
        automatic = True
    return render(request, 'support_manage.html', {
        'automatic': automatic,
        'stripe_key': settings.STRIPE_PUBLIC_KEY,
        'stripe_error': stripe_error
    })


@login_required
def cancel_membership(request):
    err_msg = ''
    try:
        cancel_subscription(request.user)
    except PaymentError as e:
        err_msg = str(e)

    return render(request, 'canceled_supporter.html', {
        'error': err_msg
    })


@login_required
def social(request):
    return render(request, 'accounts/social.html')


@csrf_exempt
def membership_webhooks(request):
    return handle_webhook(request)
