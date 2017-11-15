# RPC endpoint for actual wordwalls game.
import json

from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST

from wordwalls.game import WordwallsGame
from lib.response import bad_request, response


def rpc_response(req_id, result):
    """
    Return a JSON string in JSONRPC 2.0 format.

    """
    return response({
        'jsonrpc': '2.0',
        'result': result,
        'id': req_id
    })


def bad_rpc_response(req_id, error_message, error_code=400, error_data=None):
    """
    :error Must be an object
        {"code": 200, "message": "blah", "data": "optional"}

    """
    err_obj = {
        'jsonrpc': '2.0',
        'error': {
            'code': error_code,
            'message': error_message,
        },
        'id': req_id}
    if error_data:
        err_obj['error']['data'] = error_data
    return bad_request(bad_rpc_response)


def method_lookup(method_str):
    method_dict = {
        'guess': guess,
        'start': start,
        'giveup': giveup,
        'gameEnded': game_ended,
    }
    return method_dict.get(method_str)


@login_required
@require_POST
def table_rpc(request, tableid):
    body = json.loads(request.body)
    req_id = body.get('id', 0)

    if body.get('jsonrpc') != '2.0':
        return bad_rpc_response(req_id, 'Wrong RPC version')
    method = body.get('method')
    params = body.get('params')
    if not method:
        return bad_rpc_response(req_id, 'Bad RPC method')

    wwg = WordwallsGame()
    permitted = wwg.allow_access(request.user, tableid)
    if not permitted:
        return bad_rpc_response(req_id,
                                'No access to table {}'.format(tableid))

    handler = method_lookup(method)
    if not handler:
        return bad_rpc_response(req_id, 'RPC method {} does not exist.'.format(
            method))
    ret = handler(tableid, params)
    return rpc_response(req_id, ret)


def guess(tableid, params):
    pass


def start(tableid, params):
    pass


def giveup(tableid, params):
    pass


def game_ended(tableid, params):
    pass


def save_game(tableid, params):
    pass


def give_up_and_save(tableid, params):
    pass
