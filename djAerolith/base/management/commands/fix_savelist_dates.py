"""
I made a mistake migrating all lists to new lexicon as it updates
the saved date on these. Bring them back to what they used to be.

"""

import pickle

from django.core.management.base import BaseCommand, CommandError
from base.models import WordList


def turn_off_auto_now(ModelClass, field_name):
    def auto_now_off(field):
        field.auto_now = False

    do_to_model(ModelClass, field_name, auto_now_off)


def do_to_model(ModelClass, field_name, func):
    field = ModelClass._meta.get_field(field_name)
    func(field)


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument("pickle_file", type=str)

    def handle(self, *args, **options):
        if "pickle_file" not in options:
            raise CommandError("You must pass in pickle_file with old dates")

        dates_obj = pickle.load(open(options["pickle_file"], "rb"))

        turn_off_auto_now(WordList, "lastSaved")

        for list_id, last_saved in dates_obj.items():
            try:
                wl = WordList.objects.get(pk=list_id)
            except WordList.DoesNotExist:
                print(f"word list with id {list_id} no longer exists")
                continue

            wl.lastSaved = last_saved
            wl.save()
