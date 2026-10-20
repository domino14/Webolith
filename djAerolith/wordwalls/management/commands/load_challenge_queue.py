"""
Load the bingos a lexicon's live daily challenges should ask, and turn on the
scheduler for it (see wordwalls/challenge_scheduler.py).

The CSV has a header and the columns
    alphagram,asks_needed[,new_word[,priority]]
new_word is 0/1 and defaults to 0; priority defaults to 0 for new-word bingos
and 1 for the rest, so new words go first. Rows with asks_needed 0 are skipped.

    ./manage.py load_challenge_queue NWL23 nwl23_queue.csv --slots 5

build_challenge_queue works out the queue from the challenge data itself; this
is for hand-picked lists.
"""

import csv
import json
from types import SimpleNamespace

from django.core.management.base import BaseCommand, CommandError

from base.models import Lexicon
from wordwalls.challenge_queue import describe, save_queue


class Command(BaseCommand):
    help = __doc__

    def add_arguments(self, parser):
        parser.add_argument("lexicon", type=str)
        parser.add_argument("path", type=str)
        parser.add_argument(
            "--slots",
            type=int,
            default=None,
            help="Queued bingos per challenge (new cycles default to 5).",
        )
        parser.add_argument(
            "--no-balance",
            action="store_true",
            help="Don't give new-word bingos an easy partner.",
        )
        parser.add_argument(
            "--replace",
            action="store_true",
            help="Drop this lexicon's existing queue first.",
        )

    def handle(self, *args, **options):
        try:
            lex = Lexicon.objects.get(lexiconName=options["lexicon"])
        except Lexicon.DoesNotExist:
            raise CommandError(f"No lexicon named {options['lexicon']}")
        counts = json.loads(lex.lengthCounts)

        needs = []
        with open(options["path"]) as f:
            for row in csv.DictReader(f):
                alpha = row["alphagram"].strip().upper()
                if str(len(alpha)) not in counts:
                    raise CommandError(f"{alpha}: no {len(alpha)}s in {lex}")
                priority = row.get("priority")
                needs.append(
                    SimpleNamespace(
                        alphagram=alpha,
                        asks_needed=int(row["asks_needed"]),
                        new_word=row.get("new_word", "0").strip() == "1",
                        priority=int(priority) if priority else None,
                    )
                )
        summary = save_queue(
            lex,
            needs,
            slots=options["slots"],
            balance=not options["no_balance"],
            replace=options["replace"],
        )
        for line in describe(lex, summary):
            self.stdout.write(line)
