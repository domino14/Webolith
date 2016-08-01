# Forms that are global to a few different apps: wordwalls, flashcards,
# whitleyCards for example.
from django import forms
from base.models import Lexicon, WordList, EXCLUDED_LEXICA
from wordwalls.models import NamedList
from django.utils.translation import ugettext_lazy as _


class LexiconForm(forms.Form):
    lexicon = forms.ModelChoiceField(
        queryset=Lexicon.objects.exclude(lexiconName__in=EXCLUDED_LEXICA),
        label='Lexicon',
        widget=forms.Select(attrs={'class': 'form-control'}),
        empty_label=None)


class FindWordsForm(forms.Form):
    wlList = tuple([(repr(l), repr(l)) for l in range(2, 16)])

    wordLength = forms.ChoiceField(
        choices=wlList, label='Word Length',
        widget=forms.Select(attrs={'class': 'form-control'}))
    probabilityMin = forms.IntegerField(max_value=250000, min_value=1,
                                        label='Min probability (at least 1)')
    probabilityMax = forms.IntegerField(max_value=250000, min_value=1,
                                        label='Max probability')
    fw_num_questions = forms.IntegerField(
        max_value=200, min_value=20, initial=50,
        label='Number of questions per round',
        widget=forms.NumberInput(attrs={'class': 'form-control'}))
    # PLAYERMODE_SINGLE = 1
    # PLAYERMODE_MULTI = 2

    # playerChoices = (
    #     (GenericTableGameModel.SINGLEPLAYER_GAME, "Single player"),
    #     #(GenericTableGame.MULTIPLAYER_GAME, "Multi player"),
    # )

    # playerMode = forms.ChoiceField(choices=playerChoices,
    #                                label="Number of players")

    def clean(self):
        try:
            pmin = self.cleaned_data['probabilityMin']
        except:
            raise forms.ValidationError(
                "No value submitted for minimum probability!")
        try:
            pmax = self.cleaned_data['probabilityMax']
        except:
            raise forms.ValidationError(
                "No value submitted for maximum probability!")
        try:
            wordLength = self.cleaned_data['wordLength']
        except:
            raise forms.ValidationError(
                "You must submit a word length between 2 and 15")
        if pmin < 1:
            raise forms.ValidationError(
                "Minimum probability must be 1 or greater")
        if pmin > pmax:
            raise forms.ValidationError(
                "Minimum probability must be less than maximum probability")
        if int(wordLength) < 2 or int(wordLength) > 15:
            raise forms.ValidationError(
                "Word length must be an integer between 2 and 15")
        return self.cleaned_data


class UserListForm(forms.Form):
    file = forms.FileField(label='File')


class WordListChoiceField(forms.ModelChoiceField):
    def to_python(self, value):
        """ Normalize the choice field to an actual SavedList"""
        if not value:
            return None

        try:
            sl = WordList.objects.get(pk=value)
        except:
            return None
        return sl


class SavedListForm(forms.Form):
    CONTINUE_LIST_CHOICE = 1
    FIRST_MISSED_CHOICE = 2
    RESTART_LIST_CHOICE = 3
    listOptions = (
        (CONTINUE_LIST_CHOICE, _('Continue list')),
        (FIRST_MISSED_CHOICE, _('Quiz on first missed')),
        (RESTART_LIST_CHOICE, _('Restart list'))
    )

    listOption = forms.TypedChoiceField(
        choices=listOptions, label='Quiz options',
        widget=forms.Select(attrs={'class': 'form-control'}), coerce=int)

    wordList = WordListChoiceField(
        label='List choice',
        queryset=WordList.objects.none(),
        widget=forms.Select(attrs={'size': '10',
                                   'class': 'form-control'}))
    sl_num_questions = forms.IntegerField(
        max_value=200, min_value=20, initial=50,
        label='Number of questions per round',
        widget=forms.NumberInput(attrs={'class': 'form-control'}))


class NamedListChoiceField(forms.ModelChoiceField):
    def to_python(self, value):
        if not value:
            return None

        try:
            nl = NamedList.objects.get(pk=value)
        except:
            return None
        return nl


class NamedListForm(forms.Form):
    namedList = NamedListChoiceField(
        label='List choice',
        queryset=NamedList.objects.none(),
        widget=forms.Select(attrs={'size': '15',
                                   'class': 'form-control'}))
    nl_num_questions = forms.IntegerField(
        max_value=200, min_value=20, initial=50,
        label='Number of questions per round',
        widget=forms.NumberInput(attrs={'class': 'form-control'}))
