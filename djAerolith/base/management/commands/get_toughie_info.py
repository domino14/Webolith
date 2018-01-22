"""
A management script to get information about toughie bingos.

"""
import csv

from django.core.management.base import BaseCommand, CommandError
from django.db import connection

from lib.word_db_helper import WordDB, Alphagram


class Bingo(object):
    def __init__(self, bingo, pct, date, ntm, nta):
        self.bingo = Alphagram(bingo)
        self.pct = pct
        self.date = date
        # num tiems missed and num tiems asked
        self.ntm = ntm
        self.nta = nta


class Command(BaseCommand):
    help = """ WTF difficulty_cutoff probability_cutoff """

    def handle(self, *args, **options):
        # print "ARGS", args
        # if len(args) != 2:
        #     raise CommandError(self.help)
        difficulty_cutoff = 0.6
        probability_cutoff = 5000
        query = """
select alphagram_string, numTimesMissed / count(board_id) pct, date,
    numTimesMissed, mb.challenge_id, count(board_id), dc.lexicon_id

from wordwalls_dailychallengemissedbingos mb
inner join wordwalls_dailychallenge dc on
    mb.challenge_id = dc.id
inner join wordwalls_dailychallengeleaderboard lb on
    lb.challenge_id = dc.id
inner join wordwalls_dailychallengeleaderboardentry entry on
entry.board_id = lb.id

where dc.date != '2013-04-01'   /* april fools challenges */
and dc.lexicon_id in (4, 7)
and numTimesMissed > 10

group by entry.board_id, alphagram_string
order by pct desc
        """

        cursor = connection.cursor()
        cursor.execute(query)

        OWL2db = WordDB('OWL2')
        Americadb = WordDB('America')
        rows = cursor.fetchall()
        america_bingos = {}
        owl2_bingos = {}
        for row in rows:
            bingo = Bingo(row[0], row[1], row[2], row[3], row[5])
            if row[6] == 4:
                if row[0] not in owl2_bingos:
                    owl2_bingos[row[0]] = []
                owl2_bingos[row[0]].append(bingo)
            else:
                if row[0] not in america_bingos:
                    america_bingos[row[0]] = []
                america_bingos[row[0]].append(bingo)

        print('%s uniq owl2_bingos, %s uniq america_bingos' % (
            len(owl2_bingos), len(america_bingos)))
        with open('/tmp/toughies.csv', 'wb') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(['Alphagram', 'probability', 'difficulty'])
            self.toughiez(Americadb, america_bingos, difficulty_cutoff,
                          probability_cutoff, writer)
            print('----')
            self.toughiez(OWL2db, owl2_bingos, difficulty_cutoff,
                          probability_cutoff, writer)

    def toughiez(self, db, bingo_dict, diff, prob, csv_writer):

        america_qs = db.get_questions_from_alphagrams(
            [Alphagram(b) for b in bingo_dict])

        for q in america_qs.questions_array():
            if q.alphagram.probability < prob:
                ntm = 0
                nta = 0
                for t in bingo_dict[q.alphagram.alphagram]:
                    # Each of these is a "time" that the question was asked.
                    ntm += t.ntm
                    nta += t.nta
                pct = ntm / float(nta)
                if pct > diff:
                    csv_writer.writerow([q.alphagram.alphagram,
                                         q.alphagram.probability, pct])
