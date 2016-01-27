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

from django import forms
from django.conf import settings

from base.models import Lexicon, EXCLUDED_LEXICA


class ProfileEditForm(forms.Form):
    lexiconChoices = Lexicon.objects.exclude(lexiconName__in=EXCLUDED_LEXICA)
    defaultLexicon = forms.ModelChoiceField(
        queryset=lexiconChoices,
        label='Default Lexicon',
        widget=forms.Select(attrs={'class': 'form-control'}),
        empty_label=None)
    profileText = forms.CharField(
        widget=forms.Textarea(attrs={'class': 'form-control'}),
        label='Your profile',
        required=False)
    disableChat = forms.BooleanField(label='Disable Chat', required=False)
    default_language = forms.ChoiceField(
        choices=settings.LANGUAGES,
        required=False,
        widget=forms.Select(attrs={'class': 'form-control'}),
    )
