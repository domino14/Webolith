"""
Fix the America2016 lexicon and how we handle it. America is a bad lexicon
anyway, so there's no need to keep track of the past lexicon. We should
instead migrate everyone over transparently, especially since no words
were deleted. This script should do a number of things, along with the
rest of the PR this is in.

Test this on a prod dump first.

0. We should set a planned downtime
1. Copy the probability orders from America to America2016 for lengths 2-8
2. Migrate everyone that's on America2016 to America
3. Hide or somehow remove the America2016 lexicon
4. Migrate everyone's America2016 lists to America, checking to see that
there are no name collisions.
5. ~~_Rename_ the America lexicon to America2016 or similar~~  (No need)
6. Fix genNamedLists script to add words added in 2016 option
7. Change America lengthCounts.
8. Reload new db and gaddag, etc into macondo.
9. Bring back site.

"""

import sqlite3
import os

from django.core.management.base import BaseCommand
from django.conf import settings
from django.db import IntegrityError

from base.models import Lexicon, WordList
from accounts.models import AerolithProfile


def fixup_america2016():
    """Fix the America2016 lexicon to match the probability orders of
    the America lexicon."""
    file_path_2016 = os.path.join(settings.WORD_DB_LOCATION, "America2016.db")
    file_path_2014 = os.path.join(settings.WORD_DB_LOCATION, "America.db")
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


def migrate_users_to_America():
    """Migrate all users on America2016 to America as their default lex."""
    # Get all America2016 profiles
    profiles = AerolithProfile.objects.filter(defaultLexicon__lexiconName="America2016")
    ct = profiles.count()
    america = Lexicon.objects.get(lexiconName="America")
    print("Need to migrate {0} profiles".format(ct))
    for profile in profiles:
        profile.defaultLexicon = america
        profile.save()
    print("Migrated {0} profiles".format(ct))


def migrate_lists_to_America():
    """Migrate all America2016 lists to America."""
    lists = WordList.objects.filter(lexicon__lexiconName="America2016")
    print("Need to migrate {0} lists".format(lists.count()))
    print("Non-temp lists are")
    for wl in lists:
        if not wl.is_temporary:
            print(wl)
    america = Lexicon.objects.get(lexiconName="America")
    for wl in lists:
        wl.lexicon = america
        try:
            wl.save()
        except IntegrityError:
            print("Could not migrate list; name collision: {0}".format(wl))
    print("Migrated the lists!")


class Command(BaseCommand):
    def handle(self, *args, **options):
        # XXX: This is commented because we've already generated the file;
        # we can upload the file directly to prod.
        # fixup_america2016()
        migrate_users_to_America()
        migrate_lists_to_America()
        # Change America length counts.
        america = Lexicon.objects.get(lexiconName="America")
        america2016 = Lexicon.objects.get(lexiconName="America2016")
        america.lengthCounts = america2016.lengthCounts
        america.save()
