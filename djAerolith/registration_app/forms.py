from captcha.fields import ReCaptchaField

from django.contrib.auth.models import User
from django.utils.translation import ugettext
from django.core.exceptions import ValidationError

from registration.forms import RegistrationFormUniqueEmail


class RecaptchaRegistrationForm(RegistrationFormUniqueEmail):
    recaptcha = ReCaptchaField(label="Please prove you're not a computer")

    # Case-insensitive usernames.
    def clean_username(self):
        if User.objects.filter(username__iexact=self.cleaned_data['username']):
            raise ValidationError(ugettext(
                'A user with that username already exists.'), code='invalid')
        return self.cleaned_data['username']


def get_registration_form(use_captcha):
    if not use_captcha:
        return RegistrationFormUniqueEmail
    return RecaptchaRegistrationForm
