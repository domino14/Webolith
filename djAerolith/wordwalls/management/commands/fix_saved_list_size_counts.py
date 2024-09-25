import json

from django.core.management.base import BaseCommand

from accounts.models import AerolithProfile
from base.models import WordList


class Command(BaseCommand):
    def handle(self, *args, **options):
        profiles = AerolithProfile.objects.all()
        print(("Processing %s profiles" % profiles.count()))
        for profile in profiles:
            word_lists = WordList.objects.filter(user=profile.user, is_temporary=False)
            ct = 0
            for word_list in word_lists:
                ct += word_list.numAlphagrams
                if word_list.numAlphagrams != len(json.loads(word_list.origQuestions)):
                    print("This should not be")

            if ct != profile.wordwallsSaveListSize:
                print(
                    (
                        "Mismatch for user %s, expected %s, got %s"
                        % (profile.user, ct, profile.wordwallsSaveListSize)
                    )
                )
                profile.wordwallsSaveListSize = ct
                profile.save()
