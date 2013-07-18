from django.shortcuts import render_to_response
from current_version import CURRENT_VERSION


def main(request):
    return render_to_response('nsc2013/index.html',
                              {'CURRENT_VERSION': CURRENT_VERSION})
