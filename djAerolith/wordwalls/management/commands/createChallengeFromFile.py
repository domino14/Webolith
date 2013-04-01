from django.core.management.base import BaseCommand, CommandError
from wordwalls.models import DailyChallenge, DailyChallengeName
from base.models import Lexicon, Alphagram
from datetime import datetime
from wordwalls.utils import get_alphas_from_words, get_pks_from_alphas
import random
import json
from django.db.utils import IntegrityError


class Command(BaseCommand):
    args = 'days'
    help = 'Creates DailyChallenge instances from file(s).'

    def handle(self, *args, **options):
        if len(args) != 6:
            raise CommandError("""
Arguments: nameId lexname date numbertoselect filetype filename
nameId - The challenge name ID (a number)
lexname - The lexicon name
date - YYYYmmdd (PST)
numbertoselect - The number of questions to select from the file, randomly
filetype - pks or words
filename - full path to file.
            """)
        nameId, lexname, dt, numbertoselect, filetype, filename = args
        if filetype not in ('pks', 'words'):
            raise CommandError('File type must be pks or words')
        try:
            name = DailyChallengeName.objects.get(pk=nameId)
        except DailyChallengeName.DoesNotExist:
            raise CommandError('That name does not exist.')
        try:
            lexicon = Lexicon.objects.get(lexiconName=lexname)
        except Lexicon.DoesNotExist:
            raise CommandError('No such lexicon')
        try:
            stripped_date = datetime.strptime(dt, "%Y%m%d").date()
        except ValueError:
            raise CommandError('Badly formatted date')

        confirm = raw_input("Create challenge for date: %s, name: %s, "
                            "lex: %s? (Y/N) " % (stripped_date, name, lexicon))

        if confirm not in ('Y', 'y'):
            print "Exit"
            return

        f = open(filename, 'rb')
        self.create_challenge(name, lexicon, stripped_date,
                              int(numbertoselect), f, filetype)
        f.close()

    def create_challenge(self, name, lexicon, dt, numbertoselect, f, filetype):
        ch = DailyChallenge(lexicon=lexicon, date=dt, name=name,
                            seconds=name.timeSecs)
        if filetype == 'words':
            alpha_set = get_alphas_from_words(f)
            pk_list, msg = get_pks_from_alphas(alpha_set, lexicon.pk)
            random.shuffle(pk_list)
        elif filetype == 'pks':
            pk_list = []
            for line in f:
                try:
                    Alphagram.objects.get(pk=line)
                except Alphagram.DoesNotExist:
                    raise CommandError("Alphagram %s does not exist!" % line)
                pk_list.append(int(line))
            random.shuffle(pk_list)
        ch.alphagrams = json.dumps(pk_list[:numbertoselect])
        print "Got alphagrams, trying to save..."
        try:
            ch.save()
        except IntegrityError:
            raise CommandError("There was an error saving the challenge, "
                               "perhaps a duplicate entry?")
