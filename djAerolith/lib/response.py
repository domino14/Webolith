import json
from django.http import HttpResponse


class StatusCode(object):
    OK = 200
    BAD_REQUEST = 400
    FORBIDDEN = 403


# returns an HttpResponse with a json-dump of obj
def response(obj, status=StatusCode.OK):
    resp = HttpResponse(json.dumps(obj, ensure_ascii=False),
                        content_type="application/javascript; charset=utf-8",
                        status=status)
    return resp
