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
from datetime import timedelta

from django.conf import settings
from django.http import HttpResponseRedirect, Http404
from django.utils.translation import LANGUAGE_SESSION_KEY
from django.utils import timezone
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.shortcuts import render
from django.views.decorators.http import require_POST
import stripe

from accounts.models import AerolithProfile
from accounts.forms import ProfileEditForm, UsernameEditForm, MembershipForm
from base.models import Lexicon
from lib.response import response, bad_request
from wordwalls.models import Medal

logger = logging.getLogger(__name__)
DEFAULT_LANGUAGE = 'en'
stripe.api_key = settings.STRIPE_SECRET_KEY


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


class PaymentError(Exception):
    def __init__(self, message, failed_invoice_id=None):
        if isinstance(message, stripe.error.CardError):
            body = message.json_body
            err = body.get('error', {})
            message = err.get('message')
        super().__init__(message)
        self.failed_invoice_id = failed_invoice_id


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


def handle_stripe_payment(request, stripe_card_token: str,
                          failed_invoice_id: str):
    profile = request.user.aerolithprofile
    if profile.stripe_user_id:
        customer_id = profile.stripe_user_id
        # XXX: Handle user coming back to pay a failed payment, check their
        # subscription, etc.
        try:
            stripe.Customer.modify(customer_id, source=stripe_card_token)
        except stripe.error.CardError as e:
            raise PaymentError(e)
    else:
        customer_id = stripe.Customer.create(
            email=request.user.email,
            source=stripe_card_token
        )['id']
        profile.stripe_user_id = customer_id
        profile.save()

    plan_id = settings.MEMBERSHIPS['GOLD']['plan']

    if failed_invoice_id:
        # First try to retrieve the invoice ID and make sure it's actually
        # payable.
        invoice = stripe.Invoice.retrieve(failed_invoice_id)
        if invoice['status'] in ('paid', 'void', 'uncollectible'):
            request.session.pop('failed_invoice_id', None)
        failed_invoice_id = None

    if not failed_invoice_id:
        try:
            resp = stripe.Subscription.create(
                customer=customer_id,
                items=[{
                    'plan': plan_id,
                }],
                expand=['latest_invoice.payment_intent']
            )
        except stripe.error.CardError as e:
            raise PaymentError(e)
        if resp['status'] == 'active' and resp['latest_invoice'][
                'payment_intent']['status'] == 'succeeded':
            # Everything is copacetic.
            logger.info('Payment attempt succeeded for user %s',
                        request.user)
            update_membership(request.user)
            return
        # Otherwise, it didn't work.
        logger.info('Payment attempt failed for user %s', request.user)
        error_msg = resp['latest_invoice']['payment_intent'].get(
            'last_payment_error', {}).get('message')
        raise PaymentError(error_msg, resp['latest_invoice']['id'])

    # If we are here, we are trying to pay a failed invoice.
    logger.info('Trying to pay failed invoice %s', failed_invoice_id)
    try:
        resp = stripe.Invoice.pay(
            invoice=failed_invoice_id,
            expand=['payment_intent']
        )
    except stripe.error.CardError as e:
        raise PaymentError(e)
    latest_invoice = resp
    status = latest_invoice['payment_intent']['status']
    if status == 'succeeded':
        logger.info('Repayment attempt succeeded for user %s', request.user)
        update_membership(request.user)
        return
    elif status == 'requires_payment_method':
        # It failed.
        logger.info('Payment RE-attempt failed for user %s', request.user)
        error_msg = resp['latest_invoice']['payment_intent'].get(
            'last_payment_error', {}).get('message')
        raise PaymentError(error_msg)
    elif status == 'requires_action':
        # Probably some sort of additional authentication check.
        raise NotImplementedError


def update_membership(user):
    """ Add an extra year to the user's membership. """
    # NOTE: auto-expiry script should give the user some grace period,
    # like 7 days. Or consider using webhooks.
    profile = user.aerolithprofile
    now = timezone.now()
    if not profile.member:
        expire_time = now.replace(
            year=now.year+1,
            hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
        profile.member = True
        profile.membershipExpiry = expire_time
        profile.membershipType = AerolithProfile.GOLD_MTYPE
        profile.save()
    else:
        # Just add an extra year.
        expiry = profile.membershipExpiry
        if expiry < now:
            # So that we don't add less than a year in case expiry is already
            # in the past somehow.
            expiry = now + timedelta(days=1)
        expire_time = expiry.replace(year=expiry.year+1)

        profile.membershipExpiry = expire_time
        profile.save()


@login_required
def social(request):
    return render(request, 'accounts/social.html')
