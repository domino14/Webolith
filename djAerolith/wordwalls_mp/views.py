from django.shortcuts import render


def main(request):
    return render(request, "wordwalls_mp/index.html", {
                  'variable': request.user.username
                  })
