# Aerolith 2.0: A web-based word game website
# Copyright (C) 2011 Cesar Del Solar
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

# To contact the author, please email delsolar at gmail dot com
import json

from django.http import HttpResponseRedirect, Http404
from django.utils.translation import LANGUAGE_SESSION_KEY
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.shortcuts import render
from django.template import RequestContext

from accounts.models import AerolithProfile
from accounts.forms import ProfileEditForm

DEFAULT_LANGUAGE = 'en'


@login_required
def editProfile(request):
    try:
        profile = AerolithProfile.objects.get(user=request.user)
    except:
        raise Http404

    pForm = ProfileEditForm()
    if request.method == 'POST':
        pForm = ProfileEditForm(request.POST)
        if pForm.is_valid():    # all validation rules pass
            # process data in pForm.cleaned_data
            profile.defaultLexicon = pForm.cleaned_data['defaultLexicon']
            profile.profile = pForm.cleaned_data['profileText']
            profile.additional_data = json.dumps(
                {'disableChat': pForm.cleaned_data['disableChat']})
            profile.save()
            request.session[LANGUAGE_SESSION_KEY] = pForm.cleaned_data[
                'default_language']

            return HttpResponseRedirect('/accounts/profile/%s' %
                                        profile.user.username)
    return render(
        request, 'accounts/editProfile.html',
        {'profile': profile,
         'pForm': pForm,
         'session_language': request.session.get(
             LANGUAGE_SESSION_KEY, DEFAULT_LANGUAGE)})


def viewProfile(request, username):
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        raise Http404

    try:
        profile = AerolithProfile.objects.get(user=user)
    except AerolithProfile.DoesNotExist:
        raise Http404
        # although this shouldn't happen!! every user should have a profile

    try:
        wwMedals = json.loads(profile.wordwallsMedals)
    except (ValueError, TypeError):
        wwMedals = {}

    print wwMedals
    return render(request, 'accounts/profile.html',
                  {'profile': profile,
                   'wwMedals': wwMedals})


@login_required
def preferences(request):
    return render(request, 'accounts/preferences.html')
