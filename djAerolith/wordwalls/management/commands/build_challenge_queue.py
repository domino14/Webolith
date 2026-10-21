"""
Work out which current bingos in a lexicon still need daily-challenge asks
before their difficulty can be trusted, and queue them for the scheduler (see
wordwalls/challenge_queue.py for how "enough data" is measured).

Run it when a new lexicon goes live, and again every month or so after: each
run recounts from the challenges actually played, so turnout that was higher
or lower than expected corrects itself, and bingos that have had enough asks
drop out of the queue.

    ./manage.py build_challenge_queue NWL23 --dry-run
    ./manage.py build_challenge_queue NWL23 --slots 5
"""

import csv

from django.core.management.base import BaseCommand, CommandError

from base.models import Lexicon
from wordwalls.challenge_queue import DEFAULT_TARGET, build, describe, save_queue


class Command(BaseCommand):
    help = __doc__

    def add_arguments(self, parser):
        parser.add_argument("lexicon", type=str)
        parser.add_argument(
            "--target",
            type=float,
            default=DEFAULT_TARGET,
            help="Information each bingo should have (default %(default)s).",
        )
        parser.add_argument(
            "--players",
            type=int,
            default=None,
            help="Expected players per live ask (default: last year's median).",
        )
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
            "--dry-run",
            action="store_true",
            help="Report what would be queued without changing anything.",
        )
        parser.add_argument(
            "--csv",
            type=str,
            default=None,
            help="Also write the queue to this CSV (load_challenge_queue format).",
        )

    def handle(self, *args, **options):
        try:
            lex = Lexicon.objects.get(lexiconName=options["lexicon"])
        except Lexicon.DoesNotExist:
            raise CommandError(f"No lexicon named {options['lexicon']}")
        try:
            needs, turnout = build(lex, options["target"], players=options["players"])
        except ValueError as e:
            raise CommandError(str(e))

        for length, players in turnout.items():
            if players < 10:
                self.stderr.write(
                    f"Only ~{players:g} players per live {length}s ask; "
                    "the counts below will be off. Pass --players to override."
                )
            these = [nd for nd in needs if len(nd.alphagram) == length]
            new = [nd for nd in these if nd.new_word]
            self.stdout.write(
                f"{lex} {length}s: ~{players:g} players per live ask; "
                f"{len(these)} bingos short of data ({len(new)} with new words), "
                f"{sum(nd.asks_needed for nd in these)} asks needed"
            )
        if options["csv"]:
            with open(options["csv"], "w", newline="") as f:
                w = csv.writer(f)
                w.writerow(["alphagram", "asks_needed", "new_word"])
                for nd in needs:
                    w.writerow([nd.alphagram, nd.asks_needed, int(nd.new_word)])
        if options["dry_run"]:
            return
        summary = save_queue(
            lex,
            needs,
            slots=options["slots"],
            balance=not options["no_balance"],
            prune=True,
        )
        for line in describe(lex, summary):
            self.stdout.write(line)
