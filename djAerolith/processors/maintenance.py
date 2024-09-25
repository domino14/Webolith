import json

from base.models import Maintenance


def maintenance(request):
    m = Maintenance.objects.filter(show=True)
    if not m.count():
        return {"show_maintenance": False}
    return {"show_maintenance": m[0].show, "info": json.loads(m[0].info)}
