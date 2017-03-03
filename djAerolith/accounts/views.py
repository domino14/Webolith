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
import logging

from django.http import HttpResponseRedirect, Http404
from django.utils.translation import LANGUAGE_SESSION_KEY
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.shortcuts import render

from accounts.models import AerolithProfile
from accounts.forms import ProfileEditForm, UsernameEditForm
from wordwalls.models import Medal

logger = logging.getLogger(__name__)
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


def calculate_medals(user):
    # Later have time selection, etc.
    medals = Medal.objects.filter(user=user)
    obj = {'medals': {}}
    # The object looks like {'medals': {'Gold': 35, ...}}
    for medal_type in Medal.MEDAL_TYPES:
        obj['medals'][medal_type[1]] = medals.filter(
            medal_type=medal_type[0]).count()
    return obj


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
    return render(request, 'accounts/profile.html',
                  {'profile': profile,
                   'wwMedals': calculate_medals(user)})


@login_required
def username_change(request):
    u_form = UsernameEditForm()
    if request.method == 'POST':
        u_form = UsernameEditForm(request.POST)
        if u_form.is_valid():    # all validation rules pass
            request.user.username = u_form.cleaned_data['username']
            request.user.save()
            return HttpResponseRedirect('/accounts/username/change/done/')
    return render(
        request, 'accounts/edit_username.html',
        {'u_form': u_form})


@login_required
def social(request):
    return render(request, 'accounts/social.html')
