"""
JSONRPC 2.0 endpoint for the Great Wall.

Same envelope and dispatch shape as wordwalls.rpc, so the existing TS
generic_rpc.ts client works against it unchanged.
"""

import json
import logging

from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST

from wordwalls.infinite_game import InfiniteWallError, InfiniteWallGame, locked_wall
from wordwalls.rpc import bad_rpc_response, rpc_response

logger = logging.getLogger(__name__)

# Methods that only read. These skip the row lock and the transaction.
# getWall is deliberately not here: it reaps a stale run, which writes.
READ_ONLY = ("bitmap",)


def method_lookup(method_str):
    method_dict = {
        "getWall": get_wall,
        "bitmap": bitmap,
        "resume": resume,
        "pause": pause,
        "heartbeat": heartbeat,
        "loadChunk": load_chunk,
        "guess": guess,
    }
    return method_dict.get(method_str)


@login_required
@require_POST
def wall_rpc(request, wall_id):
    try:
        body = json.loads(request.body)
    except ValueError:
        return bad_rpc_response(0, "Malformed request body")
    req_id = body.get("id", 0)

    if body.get("jsonrpc") != "2.0":
        return bad_rpc_response(req_id, "Wrong RPC version")
    method = body.get("method")
    if not method:
        return bad_rpc_response(req_id, "Bad RPC method")
    handler = method_lookup(method)
    if not handler:
        return bad_rpc_response(req_id, "RPC method {0} does not exist.".format(method))

    params = body.get("params") or {}
    logger.info(
        "event=infinite_rpc user=%s wall=%s method=%s",
        request.user.username,
        wall_id,
        method,
    )
    try:
        if method in READ_ONLY:
            wall = InfiniteWallGame().get_wall(wall_id, request.user)
            ret = handler(wall, params)
        else:
            with locked_wall(wall_id, request.user) as wall:
                ret = handler(wall, params)
    except InfiniteWallError as e:
        return bad_rpc_response(req_id, str(e))

    return rpc_response(req_id, ret)


def get_wall(wall, params):
    game = InfiniteWallGame()
    # Opening a wall whose previous tab died should show it paused, not running.
    game.reap_if_stale(wall)
    return game.wall_detail(wall)


def bitmap(wall, params):
    return InfiniteWallGame().bitmap(wall)


def heartbeat(wall, params):
    return InfiniteWallGame().heartbeat(wall)


def resume(wall, params):
    return InfiniteWallGame().resume(wall)


def pause(wall, params):
    return InfiniteWallGame().pause(wall)


def load_chunk(wall, params):
    return InfiniteWallGame().load_chunk(wall, _int_param(params, "chunk"))


def guess(wall, params):
    guess_str = params.get("guess")
    if not isinstance(guess_str, str):
        raise InfiniteWallError("No guess supplied.")
    return InfiniteWallGame().guess(wall, _int_param(params, "chunk"), guess_str)


def _int_param(params, key):
    value = params.get(key)
    if isinstance(value, bool) or not isinstance(value, int):
        raise InfiniteWallError("Missing or invalid {0}.".format(key))
    return value
