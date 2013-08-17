import json
from django.http import HttpResponse


# returns an HttpResponse with a json-dump of obj
def response(obj, status=200):
    resp = HttpResponse(json.dumps(obj, ensure_ascii=False),
                        mimetype="application/javascript",
                        status=status)
    resp['Content-Type'] = 'text/plain; charset=utf-8'
    return resp
