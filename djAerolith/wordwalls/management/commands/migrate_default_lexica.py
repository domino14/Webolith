"""
Migrates default lexica for users from arg1 to arg2.

"""

from django.core.management.base import BaseCommand, CommandError
from base.models import Lexicon
from accounts.models import AerolithProfile


class Command(BaseCommand):
    def handle(self, *args, **options):
        if len(args) != 2:
            raise CommandError('Lexica must be specified: Old New')
        try:
            lex1 = Lexicon.objects.get(lexiconName=args[0])
            lex2 = Lexicon.objects.get(lexiconName=args[1])
        except Lexicon.DoesNotExist as e:
            raise CommandError(e)

        count = 0
        for profile in AerolithProfile.objects.all():
            if profile.defaultLexicon == lex1:
                profile.defaultLexicon = lex2
                profile.save()
                count += 1

        print 'Migrated %s profiles from %s to %s' % (count, lex1, lex2)
