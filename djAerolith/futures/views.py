# Create your views here.

from django.shortcuts import render_to_response
from django.template import RequestContext
from futures.models import FutureCategory, Future, Wallet, Transaction
from lib.response import response
import json
from django.contrib.auth.decorators import login_required
from locks import lonelock
from django.db import transaction


def main(request):
    categories = FutureCategory.objects.all()
    try:
        wallet = Wallet.objects.get(user=request.user)
        points = wallet.points
        frozen = wallet.frozen
    except Wallet.DoesNotExist:
        wallet = None
        points = 0
        frozen = 0
    categories_resp = [{'name': c.name,
                        'description': c.description,
                        'id': c.pk} for c in categories]
    context = {'categories': json.dumps(categories_resp),
               'points': points,
               'frozen': frozen,
               'wallet': wallet}
    return render_to_response('futures/index.html', context,
                              context_instance=RequestContext(request))


def futures(request):
    """
        Loads futures for category with id.
    """
    id = request.GET.get('category')
    try:
        category = FutureCategory.objects.get(id=id)
    except FutureCategory.DoesNotExist:
        return response({}, status=400)
    futures = Future.objects.filter(category=category)
    futures_resp = [{'name': f.name,
                     'description': f.description,
                     'id': f.id,
                     'is_open': f.is_open,
                     'last_buy': f.last_buy,
                     'volume': f.volume} for f in futures]
    return response(futures_resp)


def wallet(request):
    if request.method == 'POST':
        # Set up a new wallet.
        if not request.user.is_authenticated():
            return response("You must set up an Aerolith account first.",
                            status=403)
        try:
            wallet = Wallet.objects.get(user=request.user)
            return response("You already have a wallet.",
                            status=403)
        except Wallet.DoesNotExist:
            pass
        wallet = Wallet(user=request.user)
        wallet.points = 10000
        wallet.frozen = 0
        wallet.shares_owned = '{}'
        wallet.save()
        return response({'id': wallet.id, 'points': wallet.points})


def validate_order_params(num_shares, price, wallet, order_type, future):
    """
        Validate that num_shares and price are valid numbers.
        Then validate that the user can actually carry out this trade.
        Return None if everything is good, otherwise return a string error msg.
    """
    try:
        num_shares = int(num_shares)
    except (ValueError, TypeError):
        return ("Please ensure that the number of shares is a whole number "
                "greater than 0.")
    try:
        price = int(price)
    except (ValueError, TypeError):
        return ("Please ensure that the price is a whole number between 0 and "
                "1000.")


    # Now do some basic math.
    to_spend = wallet.points - wallet.frozen
    if order_type == 'buy':
        if num_shares * price > to_spend:
            return 'You cannot spend that many points!'
    elif order_type == 'sell':
        # Check if the user already has these shares.
        shares = json.loads(wallet.shares_owned)
        num_owned = 0
        if str(future.pk) in shares:
            num_owned = shares[str(future.pk)]
        if num_shares - num_owned > 0:
            # Calculate what's maximum user can lose on this short
            # sell and don't allow more than that.
            diff = num_shares - num_owned
            max_possible_loss = diff * (1000 - price)
            if max_possible_loss > to_spend:
                return ('You cannot short-sell that many of this share, as '
                        'your possible losses are not covered. If the event '
                        'happens, you can stand to lose ' +
                        str(max_possible_loss) + ' points. Try a lower '
                        'number of shares and/or a higher short-sell price.')
    else:
        return 'This is an unsupported order type. h4x?'


@login_required
def orders(request):
    if request.method == 'POST':
        # Submit an order!
        num_shares = request.POST.get('numShares')
        price = request.POST.get('price')
        order_type = request.POST.get('type')
        try:
            future = Future.objects.get(pk=request.POST.get('future'))
        except Future.DoesNotExist:
            return "That is a non-existent future."
        wallet = Wallet.objects.get(user=request.user)
        # Validate these parameters.
        error = validate_order_params(num_shares, price, wallet, order_type,
                                      future)
        if error:
            return response(error, status=400)
        # Create a transaction.
        t = Transaction(future=future, quantity=int(num_shares),
                                  unit_price=int(price))
        if order_type == 'buy':
            t.buyer = request.user
        elif order_type == 'sell':
            t.seller = request.user
        t.save()
        # Try to execute transaction now, if possible.
        with transaction.commit_on_success():
            pass

        return response(t.id)
