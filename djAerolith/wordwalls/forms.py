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
from django.core import validators
from base.models import Lexicon
from tablegame.models import GenericTableGameModel
from wordwalls.models import SavedList, DailyChallengeName
import re


lexes = Lexicon.objects.all()
lexList = tuple([(l.lexiconName, l.lexiconName) for l in lexes])

class FindWordsForm(forms.Form):
    lexicon = forms.ChoiceField(choices = lexList, label='Lexicon')
    
    wlList = tuple([(repr(l), repr(l)) for l in range(2, 16)])
    
    wordLength = forms.ChoiceField(choices = wlList, label='Word Length')
    probabilityMin = forms.IntegerField(max_value=250000, min_value = 1, label='Min probability (at least 1)')
    probabilityMax = forms.IntegerField(max_value=250000, min_value = 1, label='Max probability')
    quizTime = forms.FloatField(max_value=100, min_value = 0.05, initial=4, label='Time (minutes)')
    PLAYERMODE_SINGLE = 1
    PLAYERMODE_MULTI = 2
    
    playerChoices = (
                    (GenericTableGameModel.SINGLEPLAYER_GAME, "Single player"),
#                    (GenericTableGame.MULTIPLAYER_GAME, "Multi player"), 
                    )
    
    playerMode = forms.ChoiceField(choices=playerChoices, label="Number of players")
    
    def clean(self):
        try:
            pmin = self.cleaned_data['probabilityMin']
        except:
            raise forms.ValidationError("No value submitted for minimum probability!")
        try:
            pmax = self.cleaned_data['probabilityMax']
        except:
            raise forms.ValidationError("No value submitted for maximum probability!")
        try:
            wordLength = self.cleaned_data['wordLength']
        except:
            raise forms.ValidationError("You must submit a word length between 2 and 15")
        if pmin < 1:
            raise forms.ValidationError("Minimum probability must be 1 or greater")
        if pmin > pmax:
            raise forms.ValidationError("Minimum probability must be less than maximum probability")
        if int(wordLength) < 2 or int(wordLength) > 15:
            raise forms.ValidationError("Word length must be an integer between 2 and 15")
        
        # check specific values for probabilities based on word lengths and lexica
        # no, do this on javascript side
                
        return self.cleaned_data
        
class DailyChallengesForm(forms.Form):

    lexicon_dc = forms.ChoiceField(choices = lexList, label='Lexicon')
    challenge = forms.ModelChoiceField(queryset=DailyChallengeName.objects.all(), 
                        label='Challenge', widget=forms.Select(attrs={'size':'16'}))

class UserListForm(forms.Form):

    lexicon_ul = forms.ChoiceField(choices = lexList, label='Lexicon')
    quizTime_ul = forms.FloatField(max_value=100, min_value = 0.05, initial=4, label='Time (minutes)')
    
    file  = forms.FileField(label='File')
    
    
    
class WordListChoiceField(forms.ModelChoiceField):
    def to_python(self, value):
        """ Normalize the choice field to an actual SavedList"""
        if not value:
            return None
        
        try:
            sl = SavedList.objects.get(pk=value)
        except:
            return None
        return sl  
    
class SavedListForm(forms.Form):
    # todo have a lexicon field that has no default, and set its onchange attribute to actually call a function
    # in javascript. the javascript will auto-populate a multichoices field.
    
    CONTINUE_LIST_CHOICE = 1
    FIRST_MISSED_CHOICE = 2
    RESTART_LIST_CHOICE = 3
    DELETE_LIST_CHOICE = 4
    listOptions = (
                    (CONTINUE_LIST_CHOICE, 'Continue list'),
                    (FIRST_MISSED_CHOICE, 'Quiz on first missed'),
                    (RESTART_LIST_CHOICE, 'Restart list'),
                    (DELETE_LIST_CHOICE, 'Delete list')
                    )
    
    lexicon_sl = forms.ModelChoiceField(queryset=Lexicon.objects.all(), label='Lexicon',
            widget=forms.Select())
    quizTime_sl = forms.FloatField(max_value=100, min_value = 0.05, initial=4, label='Time (minutes)')
    listOption = forms.TypedChoiceField(choices=listOptions,label='Quiz options', widget=forms.Select(),coerce=int)
    
    wordList = WordListChoiceField(label='List choice', 
                                        queryset=SavedList.objects.none(),
                                        widget=forms.Select(attrs={'size':'10'}))

    
