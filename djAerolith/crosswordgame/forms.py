from django import forms


class GCGForm(forms.Form):
    file = forms.FileField(label='File')
