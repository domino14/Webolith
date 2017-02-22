"""
Fix the America2016 lexicon and how we handle it. America is a bad lexicon
anyway, so there's no need to keep track of the past lexicon. We should
instead migrate everyone over transparently, especially since no words
were deleted. This script should do a number of things, along with the
rest of the PR this is in.

0. We should set a planned downtime
1. Copy the probability orders from America to America2016 for lengths 2-8
2. Migrate everyone that's on America2016 to America
3. Hide or somehow remove the America2016 lexicon
4. Migrate everyone's America2016 lists to America, checking to see that
there are no name collisions.
5. _Rename_ the America lexicon to America2016 or similar
6. Fix genNamedLists script to add words added in 2016 option
7. Bring back site.

"""
import sqlite3
import os

from django.core.management.base import BaseCommand, CommandError
from django.conf import settings


def fixup_america2016():
    """ Fix the America2016 lexicon to match the probability orders of
    the America lexicon. """
    file_path_2016 = os.path.join(settings.WORD_DB_LOCATION, 'America2016.db')
    file_path_2014 = os.path.join(settings.WORD_DB_LOCATION, 'America.db')
    conn_2016 = sqlite3.connect(file_path_2016)
    conn_2014 = sqlite3.connect(file_path_2014)

    c2014 = conn_2014.cursor()
    c2016 = conn_2016.cursor()
    query = """
        SELECT alphagram, probability FROM alphagrams
        WHERE length = ?
        ORDER BY probability
    """
    update_query = """
        UPDATE alphagrams
        SET probability = ?
        WHERE alphagram = ?
    """
    for l in range(2, 9):
        # Make this query for every length of word from 2-8 in America.db
        c2014.execute(query, (l,))
        rows = c2014.fetchall()
        for row in rows:
            alpha = row[0]
            prob = row[1]
            c2016.execute(update_query, (prob, alpha))

    conn_2016.commit()
    conn_2016.close()


class Command(BaseCommand):
    def handle(self, *args, **options):
        fixup_america2016()
