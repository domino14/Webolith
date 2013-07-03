# Create your views here.

from django.shortcuts import render_to_response
from django.template import RequestContext
from futures.models import FutureCategory, Future, Wallet, Order
from lib.response import response
import json
from django.contrib.auth.decorators import login_required
from locks import lonelock
import logging
logger = logging.getLogger(__name__)


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
        if num_owned == 0:
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
        elif num_shares > num_owned:
            # We're trying to short-sell some shares, and regular-sell other
            # shares. This is potentially complicated so we will not allow it.
            return ("You own %s of those shares. Please make two separate "
                    "orders, one to sell these %s shares and one for your "
                    "additional short sell of %s shares." % (
                        num_owned, num_owned, num_shares - num_owned))
    else:
        return 'This is an unsupported order type. h4x?'


@login_required
def orders(request):
    """
        An order was submitted. This function should save it and then try
        actually executing it if there are matching orders.
        Since we are using the Django Transaction Middleware, this entire
        view function is in a transaction. If something goes wrong / times out
        it will automatically roll back (thus canceling the order).

        We will still additionally need a lock in order to prevent concurrent
        accesses by other threads.
    """
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

        return process_order(num_shares, price, wallet, order_type, future)


def process_order(num_shares, price, wallet, order_type, future):
    # Validate these parameters.
    # This is a fairly "expensive" function in that it needs to acquire
    # a lock. The lock ensures that orders can be submitted
    # and tested against open orders of the same future atomically.
    # Additionally the entire thing is wrapped in a transaction
    # (using TransactionMiddleware) so that we're not in a weird state
    # if something 500s or times out.
    # We acquire the lock prior to order validation as nothing can change
    # between the order being validated and it possibly being matched.
    lonelock(Order, future.pk)
    error = validate_order_params(num_shares, price, wallet, order_type,
                                  future)
    if error:
        return response(error, status=400)

    open_orders = Order.objects.filter(filled=False, future=future).exclude(
        creator=wallet.user)

    # Create an order.
    order = Order(future=future, quantity=int(num_shares),
                  unit_price=int(price), creator=wallet.user)
    if order_type == 'buy':
        order.order_type = Order.ORDER_TYPE_BUY
        open_orders = open_orders.filter(order_type=Order.ORDER_TYPE_SELL)
    elif order_type == 'sell':
        order.order_type = Order.ORDER_TYPE_SELL
        open_orders = open_orders.filter(order_type=Order.ORDER_TYPE_BUY)
    # Save the order, then we will see if we have a match.
    order.save()
    # Try to execute order now, if possible.
    transfers = execute_order(order, open_orders)
    # Try to execute all transfers.
    return response(order.id)


def execute_order(order, open_orders):
    """
        Attempts to execute an order against open_orders. Note this whole
        function is protected by a transaction and a lock.
        Note: This will only close a single order. Otherwise this logic gets
        annoying. Users should make multiple orders if they want to sell
        multiple.

        Logic for buying:
        - Search for lowest prices. If several orders have the same prices
        then fill them out oldest first.

        Logic for selling:
        - Search for highest prices. If several orders have the highest price
        then fill them out oldest first.
    """
    if order.order_type == Order.ORDER_TYPE_BUY:
        open_orders = open_orders.order_by('unit_price', 'last_modified')
    elif order.order_type == Order.ORDER_TYPE_SELL:
        open_orders = open_orders.order_by('-unit_price', 'last_modified')
    remaining_items = order.quantity
    transfers = []
    logger.debug(open_orders)
    for open_order in open_orders:
        if remaining_items == 0:
            break
        transfer, remaining_items = (
            try_next_order(open_order, order, remaining_items))
        if not transfer:
            break
        transfers.append(transfer)
    logger.debug(transfers)
    return transfers


def try_next_order(open_order, order, remaining_items):
    transfer = {}
    quantity = open_order.quantity
    filled_q = remaining_items - quantity
    if order.order_type == Order.ORDER_TYPE_BUY:
        # If we're buying make sure we are offering at least the lowest
        # sale price.
        if open_order.unit_price > order.unit_price:
            # We are not offering enough; break out.
            return None, None
    elif order.order_type == Order.ORDER_TYPE_SELL:
        # If we're selling make sure that we don't sell at less than the
        # highest buy price.
        if open_order.unit_price < order.unit_price:
            return None, None

    # We can fill the order (either fully or partially!). Set up the
    # points & stock transfer.
    if order.order_type == Order.ORDER_TYPE_BUY:
        # Transfer points from order.creator to open_order.creator
        transfer = {'buyer': order.creator.pk,
                    'seller': open_order.creator.pk,
                    'points': quantity * open_order.unit_price,
                    'share_quantity': quantity,
                    'share_type': order.future.pk}
    elif order.order_type == Order.ORDER_TYPE_SELL:
        # Transfer points from open_order.creator to order.creator
        transfer = {'buyer': open_order.creator.pk,
                    'seller': order.creator.pk,
                    'points': quantity * open_order.unit_price,
                    'share_quantity': quantity,
                    'share_type': order.future.pk}
    if filled_q > 0:
        # We want to buy or sell more than this open order's quantity.
        # The open order should be completely filled and we should continue
        # searching for more orders.
        open_order.filled = True
        open_order.filled_by = order.creator
        open_order.save()
        remaining_items -= quantity
        order.quantity = remaining_items
        order.save()
        return transfer, remaining_items

    elif filled_q == 0:
        # We are buying or selling the exact quantity we need. Yay!
        # Close both orders and get out of here.
        open_order.filled = True
        open_order.filled_by = order.creator
        open_order.save()
        order.filled = True
        order.filled_by = open_order.creator
        order.save()
        return transfer, 0
    elif filled_q < 0:
        # We want to buy or sell less than this open order's quantity.
        # We can fill our own order, but the open order will remain open
        # at a lower quantity level.
        order.filled = True
        order.filled_by = open_order.creator
        order.save()
        open_order.quantity = open_order.quantity - order.quantity
        open_order.save()
        return transfer, 0
