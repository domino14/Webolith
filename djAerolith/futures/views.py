# Create your views here.
from django.shortcuts import render_to_response
from django.template import RequestContext
from futures.models import (FutureCategory, Future, Wallet, Order,
                            SuccessfulTransaction, FutureHistory)
from lib.response import response
import json
from django.contrib.auth.decorators import login_required
from locks import lonelock, loneunlock
import logging
logger = logging.getLogger(__name__)


SETTLEMENT_PRICE = 1000


def wallet_response(user):
    if not user.is_authenticated():
        return None
    try:
        wallet = Wallet.objects.get(user=user)
    except Wallet.DoesNotExist:
        wallet = None
    if not wallet:
        resp = None
    else:
        resp = {'points': wallet.points,
                'frozen': wallet.frozen,
                'id': wallet.pk,
                'shares_owned': json.loads(wallet.shares_owned)}
    return resp


def orders_response(user):
    if not user.is_authenticated():
        return []
    orders = Order.objects.filter(creator=user, filled=False)
    resp = []
    for order in orders:
        resp.append({'order_type': order.order_type,
                     'future': order.future.pk,
                     'quantity': order.quantity,
                     'unit_price': order.unit_price,
                     'id': order.pk})
    return resp


def last_transactions(user):
    ret = []
    if not user.is_authenticated():
        return ret
    user_transactions = (SuccessfulTransaction.objects.filter(buyer=user) |
                         SuccessfulTransaction.objects.filter(seller=user)
                         ).order_by('-created')[:10]
    for t in user_transactions:
        obj = {}
        if t.buyer == user:
            obj['type'] = 'Buy'
        elif t.seller == user:
            obj['type'] = 'Sell'
        obj['future'] = t.future.id,
        obj['quantity'] = t.quantity
        obj['unitPrice'] = t.unit_price
        obj['date'] = str(t.created) + ' PST'  # Since our Django app is in PST
                                               # time...
        ret.append(obj)
    return ret


def main(request):
    categories_response = [{'name': c.name,
                            'description': c.description,
                            'id': c.pk} for c in FutureCategory.objects.all()]
    context = {'categories': json.dumps(categories_response),
               'wallet': json.dumps(wallet_response(request.user)),
               'orders': json.dumps(orders_response(request.user)),
               'last_transactions': json.dumps(last_transactions(request.user))
               }
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
                     'bid': f.bid,
                     'ask': f.ask,
                     'volume': f.volume} for f in futures]
    return response(futures_resp)


def wallet(request):
    if request.method == 'POST':
        # Set up a new wallet.
        if not request.user.is_authenticated():
            return response("", status=403)
        try:
            wallet = Wallet.objects.get(user=request.user)
            return response("You already have a wallet.",
                            status=403)
        except Wallet.DoesNotExist:
            pass
        wallet = Wallet(user=request.user)
        wallet.points = 100000
        wallet.frozen = 0
        wallet.shares_owned = '{}'
        wallet.save()
        return response(wallet_response(request.user))


def compute_frozen(order, wallet):
    """
        Compute how many points should be frozen by this order.
    """
    shares = json.loads(wallet.shares_owned)
    key = '%s' % order.future.pk
    num_shares = shares.get(key, 0)
    if order.order_type == Order.ORDER_TYPE_BUY:
        return order.quantity * order.unit_price
    elif order.order_type == Order.ORDER_TYPE_SELL and num_shares <= 0:
        return SETTLEMENT_PRICE * order.quantity
    return 0


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
                "%s." % SETTLEMENT_PRICE)

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
            max_possible_loss = num_shares * SETTLEMENT_PRICE
            if max_possible_loss > to_spend:
                return ('You cannot short-sell that many of this share, as '
                        'your possible losses are not covered. If the event '
                        'happens, you would need to buy back these shares, at '
                        'a cost of %s points. Try a lower '
                        'number of shares and/or a higher short-sell price.' %
                        max_possible_loss)
        elif num_shares > num_owned:
            # We're trying to short-sell some shares, and regular-sell other
            # shares. This is potentially complicated so we will not allow it.
            return ("You own %s of those shares. Please make two separate "
                    "orders, one to sell these %s shares and one for your "
                    "additional short sell of %s shares." % (
                        num_owned, num_owned, num_shares - num_owned))
    else:
        return 'This is an unsupported order type. h4x?'


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
    if not request.user.is_authenticated():
        return response("", status=403)
    if request.method == 'POST':
        # Submit an order!
        num_shares = request.POST.get('numShares')
        price = request.POST.get('price')
        order_type = request.POST.get('type')
        try:
            future = Future.objects.get(pk=request.POST.get('future'))
        except Future.DoesNotExist:
            return response("That is a non-existent future.", status=400)
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
    freeze_assets(order, wallet)

    logger.debug('*' * 20)
    logger.debug(order)
    # Try to execute order now, if possible.
    transfers = execute_order(order, open_orders)
    # Try to execute all transfers.
    execute_transfers(transfers)
    logger.debug('*' * 20)

    # Update bid/ask
    update_bid_ask(future.pk)
    return response('Success')  # Front-end should just refresh the page for
                                # ease.


def freeze_assets(order, wallet):
    """
        Freeze some assets for order.creator.
    """

    logger.debug('Freezing assets for: %s', order)
    wallet.frozen += compute_frozen(order, wallet)
    wallet.save()


def update_bid_ask(future_id):
    """
        Update the bid and ask for a future based on open orders.
    """
    future = Future.objects.get(pk=future_id)
    open_orders = Order.objects.filter(filled=False, future=future)
    bids = open_orders.filter(order_type=Order.ORDER_TYPE_BUY).order_by(
        '-unit_price')
    asks = open_orders.filter(order_type=Order.ORDER_TYPE_SELL).order_by(
        'unit_price')
    if bids.count() > 0:
        future.bid = bids[0].unit_price
    else:
        future.bid = None
    if asks.count() > 0:
        future.ask = asks[0].unit_price
    else:
        future.ask = None
    future.save()


def execute_order(order, open_orders):
    """
        Attempts to execute an order against open_orders. Note this whole
        function is protected by a transaction and a lock.

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
    logger.debug('Trying next order: %s, my order: %s, remaining_items: %s',
                 open_order, order, remaining_items)
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
    transaction = SuccessfulTransaction(future=order.future,
                                        unit_price=open_order.unit_price)
    if order.order_type == Order.ORDER_TYPE_BUY:
        # Transfer points from order.creator to open_order.creator
        transfer = {'buyer': order.creator.pk,
                    'seller': open_order.creator.pk,
                    'price': open_order.unit_price,
                    'share_type': order.future.pk}
        transaction.buyer = order.creator
        transaction.seller = open_order.creator
    elif order.order_type == Order.ORDER_TYPE_SELL:
        # Transfer points from open_order.creator to order.creator
        transfer = {'buyer': open_order.creator.pk,
                    'seller': order.creator.pk,
                    'price': open_order.unit_price,
                    'share_type': order.future.pk}
        transaction.buyer = open_order.creator
        transaction.seller = order.creator
    history_entry = FutureHistory(future=order.future,
                                  price=open_order.unit_price)

    if filled_q > 0:
        # We want to buy or sell more than this open order's quantity.
        # The open order should be completely filled and we should continue
        # searching for more orders.
        open_order.filled = True
        open_order.filled_by = order.creator
        remaining_items -= quantity
        transfer['share_quantity'] = open_order.quantity
        transfer['points'] = open_order.quantity * open_order.unit_price
        order.quantity = remaining_items
    elif filled_q == 0:
        # We are buying or selling the exact quantity we need. Yay!
        # Close both orders and get out of here.
        open_order.filled = True
        open_order.filled_by = order.creator
        order.filled = True
        order.filled_by = open_order.creator
        remaining_items = 0
        transfer['share_quantity'] = open_order.quantity
        transfer['points'] = open_order.quantity * open_order.unit_price
    elif filled_q < 0:
        # We want to buy or sell less than this open order's quantity.
        # We can fill our own order, but the open order will remain open
        # at a lower quantity level.
        order.filled = True
        order.filled_by = open_order.creator
        transfer['share_quantity'] = order.quantity
        transfer['points'] = order.quantity * open_order.unit_price
        open_order.quantity = open_order.quantity - order.quantity
        remaining_items = 0
    transaction.quantity = transfer['share_quantity']
    order.save()
    open_order.save()
    history_entry.save()
    transaction.save()
    return transfer, remaining_items


def execute_transfers(transfers):
    """
        Executes all transfers of stock and points from one user to another.
        This is still wrapped in the same view transaction for the `orders`
        function.

        Additionally we need a lock on the wallet of each of the relevant
        transferees.
    """
    for transfer in transfers:
        execute_transfer(transfer)


def execute_transfer(transfer):
    """
        Executes a single transfer. This needs to be an atomic operation.
    """
    # Lock the entire wallet. This is expensive but I can't think of a
    # better way.
    lonelock(Wallet, 0)
    buyer_wallet = Wallet.objects.get(user__pk=transfer['buyer'])
    seller_wallet = Wallet.objects.get(user__pk=transfer['seller'])
    points = transfer['points']
    shares = transfer['share_quantity']
    future = Future.objects.get(pk=transfer['share_type'])
    buyer_owned_shares = json.loads(buyer_wallet.shares_owned)
    seller_owned_shares = json.loads(seller_wallet.shares_owned)

    future_key = '%s' % future.pk
    old_buyer_owned = buyer_owned_shares.get(future_key, 0)
    buyer_owned_shares[future_key] = (old_buyer_owned + shares)
    seller_owned_shares[future_key] = (
        seller_owned_shares.get(future_key, 0) - shares)

    # Transfer some points.
    buyer_wallet.points -= points
    seller_wallet.points += points
    # Unfreeze points.
    # Buyer points -- unfreeze 'points' since they were already transferred
    # right above this - the order went through.
    buyer_wallet.frozen -= points
    # Seller points -- don't unfreeze anything. Short stock is already frozen.
    # Selling more stock, whether short or not, should not unfreeze points.
    # Buyer points -- if we just bought back some short-sold stock, should
    # unfreeze those points.
    if old_buyer_owned < 0:
        buyer_wallet.frozen -= (shares * SETTLEMENT_PRICE)
    if buyer_wallet.frozen < 0:
        buyer_wallet.frozen = 0

    buyer_wallet.shares_owned = json.dumps(buyer_owned_shares)
    seller_wallet.shares_owned = json.dumps(seller_owned_shares)
    buyer_wallet.save()
    seller_wallet.save()
    future.volume += shares
    future.last_buy = transfer['price']
    future.save()
    logger.debug('Updated future: %s', future)
    logger.debug('Updated buyer wallet: %s', buyer_wallet)
    logger.debug('Updated seller wallet: %s', seller_wallet)
    loneunlock(Wallet, 0)
