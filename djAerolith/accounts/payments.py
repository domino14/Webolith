from datetime import timedelta
import json
import logging

from django.conf import settings
from django.http import HttpResponse
from django.utils import timezone
import stripe

from accounts.models import AerolithProfile

stripe.api_key = settings.STRIPE_SECRET_KEY
logger = logging.getLogger(__name__)


class PaymentError(Exception):
    def __init__(self, message, failed_invoice_id=None):
        if isinstance(message, stripe.error.CardError):
            body = message.json_body
            err = body.get('error', {})
            message = err.get('message')
        super().__init__(message)
        self.failed_invoice_id = failed_invoice_id


def handle_stripe_payment(request, stripe_card_token: str,
                          failed_invoice_id: str):
    profile = request.user.aerolithprofile
    if profile.stripe_user_id:
        customer_id = profile.stripe_user_id
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
    if failed_invoice_id:
        # First try to retrieve the invoice ID and make sure it's actually
        # payable.
        invoice = stripe.Invoice.retrieve(failed_invoice_id)
        if invoice['status'] in ('paid', 'void', 'uncollectible'):
            request.session.pop('failed_invoice_id', None)
        failed_invoice_id = None

    if not failed_invoice_id:
        create_subscription(request.user, customer_id)
        return

    # If we are here, we are trying to pay a failed invoice.
    logger.info('Trying to pay failed invoice %s', failed_invoice_id)
    pay_invoice(request.user, failed_invoice_id)


def create_subscription(user, customer_id):
    # Check to see if the customer already has a plan.
    plan_id = settings.MEMBERSHIPS['GOLD']['plan']
    sub_info = subscription_info(user)
    if sub_info and sub_info['status'] == 'active':
        raise PaymentError(
            'You already have an active subscription. Please contact '
            'support (César) if you have any questions.')
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
        logger.info('Payment attempt succeeded for user %s', user)
        # Update the membership in the payment_succeeded webhook.
        return
    # Otherwise, it didn't work.
    logger.info('Payment attempt failed for user %s', user)
    error_msg = resp['latest_invoice']['payment_intent'].get(
        'last_payment_error', {}).get('message')
    raise PaymentError(error_msg, resp['latest_invoice']['id'])


def pay_invoice(user, invoice_id):
    try:
        resp = stripe.Invoice.pay(
            invoice=invoice_id,
            expand=['payment_intent']
        )
    except stripe.error.CardError as e:
        raise PaymentError(e)
    latest_invoice = resp
    status = latest_invoice['payment_intent']['status']
    if status == 'succeeded':
        logger.info('Repayment attempt succeeded for user %s', user)
        # Update membership in the payment_succeeded webhook.
        return
    elif status == 'requires_payment_method':
        # It failed.
        logger.info('Payment RE-attempt failed for user %s', user)
        error_msg = resp['latest_invoice']['payment_intent'].get(
            'last_payment_error', {}).get('message')
        raise PaymentError(error_msg)
    elif status == 'requires_action':
        # Probably some sort of additional authentication check.
        raise NotImplementedError


def save_stripe_card(request, stripe_card_token: str):
    profile = request.user.aerolithprofile
    customer_id = profile.stripe_user_id
    try:
        stripe.Customer.modify(customer_id, source=stripe_card_token)
    except stripe.error.CardError as e:
        raise PaymentError(e)

    # Try to reactivate any failed subscriptions immediately.
    sub_info = subscription_info(request.user)

    # XXX: HERE:
    if sub_info:
        if sub_info['status'] == 'past_due':
            # We are still within the retry period; attempt to repay
            # last invoice.
            # https://stripe.com/docs/billing/lifecycle
            logger.info('Subscription is past due; retrieving invoice...')
            latest_invoice_id = sub_info['latest_invoice']['id']
            invoice = stripe.Invoice.retrieve(latest_invoice_id)
            logger.info('Invoice status is %s', invoice['status'])
            if invoice['status'] != 'open':
                logger.error('Invoice status was not open. ID=%s',
                             latest_invoice_id)
                return
            pay_invoice(request.user, latest_invoice_id)
        elif sub_info['status'] == 'canceled':
            # Attempt to renew subscription. If the user updated their card,
            # it's a fair bet they want to renew. A canceled subscription
            # is an end state so we have to create a new one.
            create_subscription(request.user, customer_id)


def update_membership(profile):
    """ Add an extra year to the user's membership. """
    # NOTE: auto-expiry script should give the user some small grace period.
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


def get_stripe_customer(user):
    profile = user.aerolithprofile
    if profile.stripe_user_id:
        cust = stripe.Customer.retrieve(profile.stripe_user_id)
        return cust


def subscription_info(user):
    cust = get_stripe_customer(user)
    if cust is None:
        return
    subs = cust['subscriptions']
    if len(subs['data']) > 1:
        raise Exception(f'Customer for {user} has more than 1 subscription!')
    if len(subs['data']) == 0:
        return
    return subs['data'][0]


def cancel_subscription(user):
    sub = subscription_info(user)
    if sub:
        try:
            stripe.Subscription.delete(sub['id'])
        except Exception as e:
            logger.exception('Cancellation error')
            raise PaymentError(f'Unknown error canceling: {e}')
    else:
        raise PaymentError('Subscription not found')


def handle_webhook(request):
    """ XXX what happens in this scenario? :
    user's card expires. payment fails next year a couple of times.
    user logs in and updates their card, click submit.
    does it create a new subscription? should i look up the old failed payment?
    what if the old failed payment tries too many times and it gives up?
    etc? very complicated.

    Solution: I should have a separate card-update page.
    Upon saving modified card to customer, the logic should check for
    unpaid invoices. It should prompt the user to re-create the subscription
    if the last invoice has already expired / is unpayable. (The expiration
    script should have already made them expire)
    Otherwise it should attempt to pay it. XXX: Check what happens with
    Stripe when one updates their credit card and their payment is late;
    does it immediately tryto pay with it or does it wait until their scheduled
    time?
    XXX: It waits until their scheduled time. If too much time has passed,
    the invoice will be marked as unpaid and it won't try again.
    """
    # https://stripe.com/docs/billing/lifecycle

    payload = request.body
    event = None

    try:
        event = stripe.Event.construct_from(
            json.loads(payload), stripe.api_key
        )
    except ValueError:
        # Invalid payload
        return HttpResponse(status=400)

    if event.type in ('invoice.payment_succeeded', 'invoice.payment_failed'):
        process_invoice_event(event)
        return HttpResponse(status=200)

    # Unhandled event. Return a 400 because presumably this is an
    # unexpected event - we've just subscribed to the two above.
    return HttpResponse(status=400)


def process_invoice_event(event):
    invoice = event.data.object
    try:
        profile = AerolithProfile.objects.get(stripe_user_id=invoice.customer)
    except AerolithProfile.DoesNotExist:
        logger.exception('User %s does not exist', invoice.customer)
        return
    if event.type == 'invoice.payment_succeeded':
        update_membership(profile)
    elif event.type == 'invoice.payment_failed':
        # do nothing for now. Stripe will send them an email.
        pass
