# Forms that are global to a few different apps: wordwalls, flashcards,
# whitleyCards for example.
from django import forms
from base.models import Lexicon, WordList, EXCLUDED_LEXICA
from wordwalls.models import NamedList
from django.utils.translation import gettext_lazy as _


class LexiconForm(forms.Form):
    lexicon = forms.ModelChoiceField(
        queryset=Lexicon.objects.exclude(lexiconName__in=EXCLUDED_LEXICA),
        label="Lexicon",
        widget=forms.Select(attrs={"class": "form-control"}),
        empty_label=None,
    )


class NumQuestionsForm(forms.Form):
    num_questions = forms.IntegerField(
        max_value=200,
        min_value=20,
        initial=50,
        required=False,
        widget=forms.NumberInput(attrs={"class": "form-control"}),
    )


class UserListForm(forms.Form):
    file = forms.FileField(label="File")


class WordListChoiceField(forms.ModelChoiceField):
    def to_python(self, value):
        """Normalize the choice field to an actual SavedList"""
        if not value:
            return None

        try:
            sl = WordList.objects.get(pk=value)
        except WordList.DoesNotExist:
            return None
        return sl


class SavedListForm(forms.Form):
    CONTINUE_LIST_CHOICE = 1
    FIRST_MISSED_CHOICE = 2
    RESTART_LIST_CHOICE = 3
    listOptions = (
        (CONTINUE_LIST_CHOICE, _("Continue list")),
        (FIRST_MISSED_CHOICE, _("Quiz on first missed")),
        (RESTART_LIST_CHOICE, _("Restart list")),
    )

    listOption = forms.TypedChoiceField(
        choices=listOptions,
        label="Quiz options",
        widget=forms.Select(attrs={"class": "form-control"}),
        coerce=int,
    )

    wordList = WordListChoiceField(
        label="List choice",
        queryset=WordList.objects.none(),
        widget=forms.Select(attrs={"size": "10", "class": "form-control"}),
    )


class NamedListChoiceField(forms.ModelChoiceField):
    def to_python(self, value):
        if not value:
            return None

        try:
            nl = NamedList.objects.get(pk=value)
        except NamedList.DoesNotExist:
            return None
        return nl


class NamedListForm(forms.Form):
    namedList = NamedListChoiceField(
        label="List choice",
        queryset=NamedList.objects.none(),
        widget=forms.Select(attrs={"size": "15", "class": "form-control"}),
    )
