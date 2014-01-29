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
from wordwalls.models import DailyChallengeName


class TimeForm(forms.Form):
    quizTime = forms.FloatField(
        max_value=100, min_value=0.05, initial=4,
        label='Time (minutes)',
        widget=forms.TextInput())


class DailyChallengesForm(forms.Form):
    challengeDate = forms.DateField(label='Date', required=False)
    challenge = forms.ModelChoiceField(
        queryset=DailyChallengeName.objects.all(),
        label='Challenge',
        widget=forms.Select(attrs={'size': '18',
                                   'class': 'form-control'}))
