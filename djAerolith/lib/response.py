import json
from django.http import HttpResponse


class StatusCode(object):
    OK = 200
    BAD_REQUEST = 400
    UNAUTHORIZED = 401
    FORBIDDEN = 403


# returns an HttpResponse with a json-dump of obj
def response(obj, status=StatusCode.OK):
    resp = HttpResponse(
        json.dumps(obj, ensure_ascii=False),
        content_type="application/json; charset=utf-8",
        status=status,
    )
    return resp


def bad_request(obj):
    return response(obj, StatusCode.BAD_REQUEST)
