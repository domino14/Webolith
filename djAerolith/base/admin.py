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
from base.models import Lexicon, Alphagram, Word
from django.contrib import admin

class WordAdmin(admin.ModelAdmin):
    fields = ['word', 'definition', 'alphagram']
    search_fields = ['word']
    list_display = ('word', 'definition', 'alphagram', 'lexicon')

def getWordsForAlphagram(obj):
    return obj.word_set.all()

class AlphagramAdmin(admin.ModelAdmin):
    search_fields = ['alphagram']
    list_display = ('alphagram', 'lexicon', 'probability', getWordsForAlphagram)

admin.site.register(Lexicon)
#admin.site.register(Alphagram, AlphagramAdmin)
#admin.site.register(Word, WordAdmin)