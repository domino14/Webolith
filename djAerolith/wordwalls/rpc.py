# RPC endpoint for actual wordwalls game.
import json

from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST

from wordwalls.game import WordwallsGame
from lib.response import bad_request, response

# from wordwalls.socket_consumers import broadcast_to_table, BroadcastTypes


class RPCError(Exception):
    pass


def rpc_response(req_id, result):
    """
    Return a JSON string in JSONRPC 2.0 format.

    """
    return response({"jsonrpc": "2.0", "result": result, "id": req_id})


def bad_rpc_response(req_id, error_message, error_code=400, error_data=None):
    """
    :error Must be an object
        {"code": 200, "message": "blah", "data": "optional"}

    """
    err_obj = {
        "jsonrpc": "2.0",
        "error": {
            "code": error_code,
            "message": error_message,
        },
        "id": req_id,
    }
    if error_data:
        err_obj["error"]["data"] = error_data
    return bad_request(err_obj)


def method_lookup(method_str):
    method_dict = {
        "guess": guess,
        "start": start,
        "giveup": giveup,
        "timerEnded": game_timer_ended,
    }
    return method_dict.get(method_str)


@login_required
@require_POST
def table_rpc(request, tableid):
    body = json.loads(request.body)
    req_id = body.get("id", 0)

    if body.get("jsonrpc") != "2.0":
        return bad_rpc_response(req_id, "Wrong RPC version")
    method = body.get("method")
    params = body.get("params")
    if not method:
        return bad_rpc_response(req_id, "Bad RPC method")

    wwg = WordwallsGame()
    permitted = wwg.allow_access(request.user, tableid)
    if not permitted:
        return bad_rpc_response(req_id, "No access to table {}".format(tableid))

    handler = method_lookup(method)
    if not handler:
        return bad_rpc_response(req_id, "RPC method {} does not exist.".format(method))
    try:
        ret = handler(request.user, tableid, params)
    except RPCError as e:
        return bad_rpc_response(req_id, str(e))

    return rpc_response(req_id, ret)


def guess(user, tableid, params):
    g = params["guess"]
    wrong_answers = params.get("wrongAnswers", 0)
    wwg = WordwallsGame()
    state = wwg.guess(g.strip(), tableid, user, wrong_answers=wrong_answers)
    if state is None:
        raise RPCError("Quiz is already over.")

    game_packet = {
        "g": state["going"],
        "C": state["alphagram"],
        "w": state["word"],
        "a": state["already_solved"],
        "s": state["solver"],
    }
    # If this is a multiplayer game, should broadcast to group.
    # if wwg.is_multiplayer(tableid):
    #     broadcast_to_table(tableid, BroadcastTypes.GUESS_RESPONSE, game_packet)
    return game_packet


def start(user, tableid, params):
    wwg = WordwallsGame()
    quiz_params = wwg.start_quiz(tableid, user)
    if "error" in quiz_params:
        raise RPCError(quiz_params["error"])
    # If this is a multiplayer game, should broadcast to group.
    # if wwg.is_multiplayer(tableid):
    #     broadcast_to_table(tableid, BroadcastTypes.GAME_PAYLOAD, quiz_params)
    return quiz_params


def giveup(user, tableid, params):
    wwg = WordwallsGame()
    success = wwg.give_up(user, tableid)
    if success is not True:
        raise RPCError(success)
    return True


def game_timer_ended(user, tableid, params):
    wwg = WordwallsGame()
    success = wwg.check_game_ended(tableid)
    if success is not True:
        raise RPCError(success)
    return True


def save_game(user, tableid, params):
    pass


def give_up_and_save(user, tableid, params):
    pass
