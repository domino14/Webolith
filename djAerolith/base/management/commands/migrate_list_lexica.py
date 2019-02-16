"""
Migrates all lists for users from lexicon1 to lexicon2

"""
from django.core.management.base import BaseCommand, CommandError

from base.models import Lexicon, SavedList


def turn_off_auto_now(ModelClass, field_name):
    def auto_now_off(field):
        field.auto_now = False
    do_to_model(ModelClass, field_name, auto_now_off)


def do_to_model(ModelClass, field_name, func):
    field = ModelClass._meta.get_field(field_name)
    func(field)


class Command(BaseCommand):

    def add_arguments(self, parser):
        parser.add_argument('lexicon1', type=str)
        parser.add_argument('lexicon2', type=str)

    def handle(self, *args, **options):
        if 'lexicon1' not in options or 'lexicon2' not in options:
            raise CommandError('Lexica must be specified: Old New')
        try:
            lex1 = Lexicon.objects.get(lexiconName=options['lexicon1'])
            lex2 = Lexicon.objects.get(lexiconName=options['lexicon2'])
        except Lexicon.DoesNotExist as e:
            raise CommandError(e)

        count = 0
        turn_off_auto_now(SavedList, 'lastSaved')

        for word_list in SavedList.objects.filter(lexicon=lex1,
                                                  is_temporary=False):
            count += 1
            word_list.lexicon = lex2
            word_list.save()
        print('Migrated %s lists from %s to %s' % (count, lex1, lex2))
