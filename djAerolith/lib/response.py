import json
from django.http import HttpResponse


# returns an HttpResponse with a json-dump of obj
def response(obj, status=200):
    resp = HttpResponse(json.dumps(obj, ensure_ascii=False),
                        content_type="application/javascript; charset=utf-8",
                        status=status)
    return resp
