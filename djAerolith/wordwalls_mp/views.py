from django.shortcuts import render
from base.forms import NamedListForm
from django.contrib.auth.decorators import login_required


@login_required
def main(request):
    nl_form = NamedListForm()
    return render(request, "wordwalls_mp/index.html", {
                  'variable': request.user.username,
                  'nlForm': nl_form
                  })
