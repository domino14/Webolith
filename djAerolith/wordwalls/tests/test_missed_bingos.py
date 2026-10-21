import json
import threading
import time

from django.contrib.auth.models import User
from django.db import connection, transaction
from django.test import TestCase, TransactionTestCase
from django.utils import timezone

from base.models import Lexicon
from wordwalls.game import WordwallsGame, record_missed_bingos
from wordwalls.models import (
    DailyChallenge,
    DailyChallengeLeaderboardEntry,
    DailyChallengeMissedBingos,
    DailyChallengeName,
)


def missed_counts(dc):
    return dict(
        DailyChallengeMissedBingos.objects.filter(challenge=dc).values_list(
            "alphagram_string", "numTimesMissed"
        )
    )


def make_challenge(name="Today's 7s"):
    return DailyChallenge.objects.create(
        lexicon=Lexicon.objects.get(lexiconName="NWL20"),
        name=DailyChallengeName.objects.get(name=name),
        date=timezone.localtime(timezone.now()).date(),
        seconds=270,
        alphagrams="[]",
    )


class RecordMissedBingosTest(TestCase):
    fixtures = [
        "test/lexica.yaml",
        "test/users.json",
        "test/profiles.json",
        "challenge_names.json",
    ]

    def test_counts_accumulate(self):
        dc = make_challenge()
        record_missed_bingos(dc, {"AEINRST", "ADEGINR"})
        record_missed_bingos(dc, {"ADEGINR", "EIKLNST"})
        record_missed_bingos(dc, set())
        self.assertEqual(missed_counts(dc), {"AEINRST": 1, "ADEGINR": 2, "EIKLNST": 1})

    def test_challenges_count_separately(self):
        dc = make_challenge()
        other = make_challenge("Today's 8s")
        record_missed_bingos(dc, {"AEINRST"})
        record_missed_bingos(other, {"AEINRST"})
        self.assertEqual(missed_counts(dc), {"AEINRST": 1})
        self.assertEqual(missed_counts(other), {"AEINRST": 1})

    def test_players_misses_are_recorded(self):
        lex = Lexicon.objects.get(lexiconName="NWL20")
        sevens = DailyChallengeName.objects.get(name="Today's 7s")
        today = timezone.localtime(timezone.now()).date()
        wwg = WordwallsGame()

        def play(user, solve):
            table = wwg.initialize_daily_challenge(user, lex, sevens, today)
            wwg.start_quiz(table, user)
            for words in solve:
                for w in words:
                    wwg.guess(w, table, user)
            wwg.give_up(user, table)

        first = User.objects.get(username="cesar")
        second = User.objects.get(username="user_4738")
        play(first, [])
        dc = DailyChallenge.objects.get(lexicon=lex, name=sevens, date=today)
        questions = json.loads(dc.alphagrams)
        self.assertEqual(missed_counts(dc), {q["q"]: 1 for q in questions})

        # The second player solves the first ten.
        play(second, [q["a"] for q in questions[:10]])
        expected = {q["q"]: 2 for q in questions}
        expected.update({q["q"]: 1 for q in questions[:10]})
        self.assertEqual(missed_counts(dc), expected)
        self.assertEqual(
            DailyChallengeLeaderboardEntry.objects.get(user=second).score,
            sum(len(q["a"]) for q in questions[:10]),
        )


class ConcurrentMissedBingosTest(TransactionTestCase):
    """Two players' requests both being first to miss an alphagram."""

    fixtures = ["test/lexica.yaml", "challenge_names.json"]

    def test_simultaneous_first_misses_both_count(self):
        dc = make_challenge()
        first_in = threading.Event()
        errors = []

        def first():
            try:
                with transaction.atomic():
                    record_missed_bingos(dc, {"AEINRST", "ADEGINR"})
                    first_in.set()
                    # Hold the transaction open while the second one inserts.
                    time.sleep(0.5)
            except Exception as e:  # noqa: BLE001
                errors.append(e)
                first_in.set()
            finally:
                connection.close()

        def second():
            try:
                first_in.wait(5)
                with transaction.atomic():
                    record_missed_bingos(dc, {"ADEGINR", "EIKLNST"})
            except Exception as e:  # noqa: BLE001
                errors.append(e)
            finally:
                connection.close()

        threads = [threading.Thread(target=first), threading.Thread(target=second)]
        for t in threads:
            t.start()
        for t in threads:
            t.join(10)
        self.assertEqual(errors, [])
        self.assertEqual(missed_counts(dc), {"AEINRST": 1, "ADEGINR": 2, "EIKLNST": 1})
