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
from django.contrib import admin
from accounts.models import AerolithProfile
from django import forms


class ProfileAdminForm(forms.ModelForm):
    class Meta:
        model = AerolithProfile
        fields = '__all__'
        widgets = {
            'profile': forms.Textarea(attrs={'cols': 80, 'rows': 10}),
            'customWordwallsStyle': forms.Textarea(
                attrs={'cols': 80, 'rows': 3})
        }


class AerolithProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'member', 'wordwallsSaveListSize']
    search_fields = ['user__username', 'member']
    form = ProfileAdminForm

admin.site.register(AerolithProfile, AerolithProfileAdmin)
