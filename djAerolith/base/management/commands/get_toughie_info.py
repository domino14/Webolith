"""
A management script to get information about toughie bingos.
"""
import csv
import os

from django.core.management.base import BaseCommand
from django.db import connections

from base.models import Lexicon
from lib.domain import Alphagram
from lib.wdb_interface.wdb_helper import questions_from_alphagrams


# These are the set of single-anagram bingo alphagrams that were deleted
# between America and NWL2018.
# There were no words deleted between OWL2 and America
delenda = set(['ACEHSTZ', 'DEHIKKRS', 'AEHILOST', 'ABEEIRSS', 'ADEIPSST',
               'EEIRSTU', 'EEISSTTU'])


class Bingo(object):
    def __init__(self, bingo, pct, date, ntm, nta):
        self.bingo = Alphagram(bingo)
        self.pct = pct
        self.date = date
        # num times missed and num times asked
        self.ntm = ntm
        self.nta = nta


class Command(BaseCommand):
    # help = """ WTF difficulty_cutoff probability_cutoff """

    def handle(self, *args, **options):
        difficulty_cutoff = -1
        probability_cutoff = 500000
        query = """
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
and dc.lexicon_id in (4, 7, 9)  /* owl2, america, nwl18 */
group by entry.board_id, alphagram_string, dc.date, mb."numTimesMissed",
    mb."challenge_id", dc.lexicon_id
order by pct_missed desc
        """
        # a bit of a hack here. This is meant to run on a prod backup of
        # the database.
        import django.conf as conf
        conf.settings.DATABASES['prod_db'] = {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': 'djaerolith_prod_backup',
            # Use the same connection info for everything else..
            'USER': os.environ.get('PGSQL_USER'),
            'PASSWORD': os.environ.get('PGSQL_PASSWORD'),
            'HOST': os.environ.get('PGSQL_HOST'),
            'PORT': os.environ.get('PGSQL_PORT', '5432'),
        }

        with connections['prod_db'].cursor() as cursor:
            cursor.execute(query)
            rows = cursor.fetchall()
            america_bingos = {}
            owl2_bingos = {}
            nwl18_bingos = {}
            for row in rows:
                bingo = Bingo(row[0], row[1], row[2], row[3], row[5])
                if row[6] == 4:
                    if row[0] not in owl2_bingos:
                        owl2_bingos[row[0]] = []
                    owl2_bingos[row[0]].append(bingo)
                elif row[6] == 7:
                    if row[0] not in america_bingos:
                        america_bingos[row[0]] = []
                    america_bingos[row[0]].append(bingo)
                elif row[6] == 9:
                    if row[0] not in nwl18_bingos:
                        nwl18_bingos[row[0]] = []
                    nwl18_bingos[row[0]].append(bingo)

        print('%s uniq owl2, %s uniq america, %s uniq nwl18' % (
            len(owl2_bingos), len(america_bingos), len(nwl18_bingos)))
        with open('./toughies.csv', 'w') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(['Alphagram', 'probability', 'asked', 'missed',
                             'difficulty', 'lexicon', 'lexupdate'])
            print('----')
            self.toughiez('America', america_bingos, difficulty_cutoff,
                          probability_cutoff, writer)
            print('---')
            self.toughiez('OWL2', owl2_bingos, difficulty_cutoff,
                          probability_cutoff, writer)
            print('--')
            self.toughiez('NWL18', nwl18_bingos, difficulty_cutoff,
                          probability_cutoff, writer)
            print('-')

    def toughiez(self, lexname, bingo_dict, diff, prob, csv_writer):

        qs = questions_from_alphagrams(
            Lexicon.objects.get(lexiconName=lexname),
            bingo_dict.keys(),
            expand=True)

        for q in qs.questions_array():
            if q.alphagram.probability < prob:
                ntm = 0
                nta = 0
                for t in bingo_dict[q.alphagram.alphagram]:
                    # Each of these is a "time" that the question was asked.
                    ntm += t.ntm
                    nta += t.nta
                pct = ntm / float(nta)
                contains_update = any([
                    '+' in w.lexicon_symbols for w in q.answers])
                if pct > diff and q.alphagram.alphagram not in delenda:
                    csv_writer.writerow([q.alphagram.alphagram,
                                         q.alphagram.probability,
                                         nta, ntm, pct, lexname,
                                         '+' if contains_update else ''])
