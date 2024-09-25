"""
A management script to get information about toughie bingos.
"""

import csv
from typing import Set
from lib.wdb_interface.wdb_helper import (
    questions_from_probability_range,
)
import os

from django.core.management.base import BaseCommand, CommandError
from django.db import connections

from base.models import Lexicon
from lib.domain import Alphagram
from lib.wdb_interface.wdb_helper import questions_from_alphagrams


class Bingo(object):
    def __init__(self, bingo, pct, date, ntm, nta):
        self.bingo = Alphagram(bingo)
        self.pct = pct
        self.date = date
        # num times missed and num times asked
        self.ntm = ntm
        self.nta = nta


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument("lexicon_family", type=str)

    def handle(self, *args, **options):
        lex_family = "NWL"
        lexicon_names = [
            "America",
            "OWL2",
            "NWL18",
            "NWL20",
        ]
        if "lexicon_family" not in options:
            raise CommandError("Specify a lexicon family")

        lex_family = options["lexicon_family"]
        if lex_family == "CSW":
            # Use the lexica above, plus CSW12, CSW15, CSW19.
            # We do this here because CSW is almost strictly a superset
            # of NWL.
            lexicon_family_ids = "(4,7,9,15,6,1,12)"
            latest_lexicon = "CSW19"
            lexicon_names.extend(["CSW12", "CSW15", "CSW19"])
        elif lex_family == "NWL":
            lexicon_family_ids = "(4,7,9,15)"  # owl2, america, nwl18, nwl20
            latest_lexicon = "NWL20"
        else:
            raise Exception("lexicon_family must be either NWL or CSW")

        query = f"""
select alphagram_string,
    mb."numTimesMissed"::decimal / count(board_id) as pct_missed,
    date,
    mb."numTimesMissed" as num_missed,
    mb.challenge_id,
    count(board_id) as num_played,
    dc.lexicon_id
from wordwalls_dailychallengemissedbingos mb
inner join wordwalls_dailychallenge dc on
    mb.challenge_id = dc.id
inner join wordwalls_dailychallengeleaderboard lb on
    lb.challenge_id = dc.id
inner join wordwalls_dailychallengeleaderboardentry entry on
entry.board_id = lb.id

where dc.date != '2013-04-01'   /* april fools challenges */
and dc.lexicon_id in {lexicon_family_ids}
group by entry.board_id, alphagram_string, dc.date, mb."numTimesMissed",
    mb."challenge_id", dc.lexicon_id
order by pct_missed desc
        """
        # a bit of a hack here. This is meant to run on a prod backup of
        # the database.
        import django.conf as conf

        conf.settings.DATABASES["prod_db"] = {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": "djaerolith_prod_backup",
            # Use the same connection info for everything else..
            "USER": os.environ.get("PGSQL_USER"),
            "PASSWORD": os.environ.get("PGSQL_PASSWORD"),
            "HOST": os.environ.get("PGSQL_HOST"),
            "PORT": os.environ.get("PGSQL_PORT", "5432"),
        }
        lexica = {k.id: k.lexiconName for k in Lexicon.objects.all()}
        with connections["prod_db"].cursor() as cursor:
            cursor.execute(query)
            rows = cursor.fetchall()
            bingos_by_dict = {v: {} for _, v in lexica.items()}
            print("initializing bingos dict", bingos_by_dict)
            for row in rows:
                bingo = Bingo(row[0], row[1], row[2], row[3], row[5])
                lex_code = row[6]
                lex_name = lexica[lex_code]
                if row[0] not in bingos_by_dict[lex_name]:
                    bingos_by_dict[lex_name][row[0]] = []
                bingos_by_dict[lex_name][row[0]].append(bingo)

        for _, v in lexica.items():
            lt = len(bingos_by_dict[v])
            if lt > 0:
                print(f"{v} bingos: {lt}")

        latest_7s = questions_from_probability_range(
            Lexicon.objects.get(lexiconName=latest_lexicon),
            1,
            500000,
            7,
            False,
        )
        latest_8s = questions_from_probability_range(
            Lexicon.objects.get(lexiconName=latest_lexicon),
            1,
            500000,
            8,
            False,
        )
        latest_bingos = (
            latest_7s.alphagram_string_set() | latest_8s.alphagram_string_set()
        )

        with open("./toughies.csv", "w") as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(
                [
                    "Alphagram",
                    "probability",
                    "asked",
                    "missed",
                    "difficulty",
                    "lexicon",
                    "lexupdate",
                    "lexcsw",
                ]
            )
            for d in lexicon_names:
                print("----")
                self.toughiez(
                    d,
                    bingos_by_dict[d],
                    writer,
                    latest_bingos,
                )

    def toughiez(self, lexname, bingo_dict, csv_writer, latest_bingos: Set):

        qs = questions_from_alphagrams(
            Lexicon.objects.get(lexiconName=lexname),
            bingo_dict.keys(),
            expand=True,
        )

        for q in qs.questions_array():
            ntm = 0
            nta = 0
            for t in bingo_dict[q.alphagram.alphagram]:
                # Each of these is a "time" that the question was asked.
                ntm += t.ntm
                nta += t.nta
            pct = ntm / float(nta)
            contains_update = any(["+" in w.lexicon_symbols for w in q.answers])
            contains_csw_only = any(["#" in w.lexicon_symbols for w in q.answers])
            if q.alphagram.alphagram in latest_bingos:
                csv_writer.writerow(
                    [
                        q.alphagram.alphagram,
                        q.alphagram.probability,
                        nta,
                        ntm,
                        pct,
                        lexname,
                        "1" if contains_update else "0",
                        "1" if contains_csw_only else "0",
                    ]
                )
