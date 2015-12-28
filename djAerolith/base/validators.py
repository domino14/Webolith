"""
The schema for the alphagrams should be here.

"""

from django.core.exceptions import ValidationError
import json


def word_list_format_validator(value):
    # XXX: Ugly, make this use JSON Schema eventually. This is mostly
    # here for documentation purposes.
    try:
        data = json.loads(value)
    except (ValueError, TypeError):
        raise ValidationError('Invalid JSON in word list format.')

    if type(data) != list:
        raise ValidationError('Must be a list of alphagrams.')

    # Handle case where this is a range of probabilities. In this case,
    # it should just be two numbers between 1 and the word length. This
    # validator will just check that they are two numbers.
    # This case should only be used for "named lists", and not for
    # the regular word lists.
    if len(data) == 2 and type(data[0]) == int and type(data[1]) == int:
        return

    for datum in data:
        if type(datum) != dict:
            raise ValidationError('Each question must be a dict.')
        if 'q' not in datum or 'a' not in datum:
            raise ValidationError('"q" and "a" key must be in each question.')
        if not issubclass(type(datum['q']), basestring):
            raise ValidationError('Each question must be a string.')
        if type(datum['a']) != list:
            raise ValidationError('Each answer must be a list.')
        for a in datum['a']:
            if not issubclass(type(a), basestring):
                raise ValidationError('Each answer in list must be a string.')
