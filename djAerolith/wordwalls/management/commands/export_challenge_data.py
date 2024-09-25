from django.core.management.base import BaseCommand
import json
import csv
from django.db import connection

FILENAME = "/tmp/challenges_raw.csv"


class Command(BaseCommand):
    def handle(self, *args, **options):
        """
        Exports all challenge data to csv.
        """

        # Use a raw SQL query as it is about 10000 times faster or something
        # like that.
        query = """
            select date, username, name, maxScore, score, timeRemaining,
                lexiconName
                from wordwalls_dailychallengeleaderboardentry e
            inner join auth_user u on
                e.user_id = u.id
            inner join wordwalls_dailychallengeleaderboard b on
                e.board_id = b.id
            inner join wordwalls_dailychallenge dc on
                dc.id = b.challenge_id
            inner join base_lexicon lex on
                dc.lexicon_id = lex.id
            inner join wordwalls_dailychallengename nm on
                nm.id = dc.name_id order by date
        """
        cursor = connection.cursor()
        cursor.execute(query)
        with open(FILENAME, "wb") as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(
                [
                    "Date",
                    "Username",
                    "Challenge Name",
                    "Max Score",
                    "Score",
                    "Time Remaining",
                    "Lexicon",
                ]
            )
            row = cursor.fetchone()
            while row is not None:
                writer.writerow(row)
                row = cursor.fetchone()
