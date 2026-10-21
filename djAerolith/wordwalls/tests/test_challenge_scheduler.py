import json
import os
import tempfile
from datetime import timedelta
from io import StringIO
from unittest.mock import patch

from django.contrib.auth.models import User
from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone

from base.models import Lexicon
from lib.domain import Alphagram, Question, Questions
from lib.wdb_interface.wdb_helper import questions_from_alphagrams
from wordwalls.challenge_queue import (
    collect_asks,
    compute_needs,
    lexicon_ids,
    typical_turnout,
)
from wordwalls.challenge_scheduler import build_plan, pass_permutation
from wordwalls.game import WordwallsGame
from wordwalls.models import (
    ChallengeCycle,
    ChallengeQueueItem,
    DailyChallenge,
    DailyChallengeLeaderboard,
    DailyChallengeLeaderboardEntry,
    DailyChallengeMissedBingos,
    DailyChallengeName,
)

QUEUED = ["AEINRST", "ADEGINR", "EIKLNST"]


def easy(*alphas):
    qs = Questions()
    for a in alphas:
        qs.append(Question(Alphagram(a, difficulty=10), []))
    return qs


class ChallengeSchedulerTest(TestCase):
    fixtures = [
        "test/lexica.yaml",
        "test/users.json",
        "test/profiles.json",
        "challenge_names.json",
    ]

    def setUp(self):
        self.user = User.objects.get(username="cesar")
        self.lex = Lexicon.objects.get(lexiconName="NWL20")
        self.sevens = DailyChallengeName.objects.get(name="Today's 7s")
        self.today = timezone.localtime(timezone.now()).date()
        self.cycle = ChallengeCycle.objects.create(
            lexicon=self.lex, word_length=7, seed=1234, balance=False
        )
        for i, alpha in enumerate(QUEUED):
            ChallengeQueueItem.objects.create(
                lexicon=self.lex,
                alphagram=alpha,
                word_length=7,
                asks_remaining=2,
                priority=i,
            )

    def play(self, day):
        WordwallsGame().initialize_daily_challenge(
            self.user, self.lex, self.sevens, day
        )
        dc = DailyChallenge.objects.get(lexicon=self.lex, name=self.sevens, date=day)
        return [q["q"] for q in json.loads(dc.alphagrams)]

    def test_live_challenge_asks_queue_then_cycle(self):
        alphas = self.play(self.today)
        self.assertEqual(len(alphas), 50)
        self.assertEqual(len(set(alphas)), 50)
        self.assertTrue(all(len(a) == 7 for a in alphas))
        self.assertTrue(set(QUEUED) <= set(alphas))
        for item in ChallengeQueueItem.objects.all():
            self.assertEqual(item.asks_remaining, 1)
            self.assertEqual(item.last_asked, self.today)
        # 47 cycle slots, plus any steps skipped for landing on a queued bingo.
        self.cycle.refresh_from_db()
        self.assertGreaterEqual(self.cycle.cursor, 47)
        self.assertLessEqual(self.cycle.cursor, 50)

    def test_slots_cap_queue(self):
        self.cycle.priority_slots = 2
        self.cycle.save()
        alphas = self.play(self.today)
        self.assertTrue({"AEINRST", "ADEGINR"} <= set(alphas))
        self.assertEqual(
            ChallengeQueueItem.objects.get(alphagram="EIKLNST").asks_remaining, 2
        )

    def test_queued_bingos_wait_between_asks(self):
        ChallengeQueueItem.objects.update(last_asked=self.today - timedelta(days=3))
        plan = build_plan(self.cycle, self.lex, 7, self.today)
        self.assertEqual(plan.asked_ids, [])
        plan = build_plan(self.cycle, self.lex, 7, self.today + timedelta(days=4))
        self.assertEqual(len(plan.asked_ids), 3)

    def test_past_dates_stay_random(self):
        self.play(self.today - timedelta(days=30))
        self.cycle.refresh_from_db()
        self.assertEqual(self.cycle.cursor, 0)
        self.assertEqual(ChallengeQueueItem.objects.filter(last_asked=None).count(), 3)

    def test_no_cycle_stays_random(self):
        self.cycle.delete()
        self.play(self.today)
        self.assertEqual(ChallengeQueueItem.objects.filter(last_asked=None).count(), 3)

    def test_unknown_alphagram_is_retired(self):
        ChallengeQueueItem.objects.create(
            lexicon=self.lex, alphagram="AAAAAAA", word_length=7, asks_remaining=2
        )
        alphas = self.play(self.today)
        self.assertNotIn("AAAAAAA", alphas)
        self.assertEqual(len(alphas), 50)
        self.assertEqual(
            ChallengeQueueItem.objects.get(alphagram="AAAAAAA").asks_remaining, 0
        )

    def test_new_words_get_easy_partners(self):
        self.cycle.balance = True
        self.cycle.save()
        ChallengeQueueItem.objects.filter(alphagram__in=QUEUED[:2]).update(
            new_word=True
        )
        # One candidate is already queued and must not be picked twice.
        with patch(
            "wordwalls.challenge_scheduler.word_search",
            return_value=easy("AEINRST", "ABEILST", "ACEINRT"),
        ):
            plan = build_plan(self.cycle, self.lex, 7, self.today)
        alphas = [q.alphagram.alphagram for q in plan.questions.questions_array()]
        self.assertEqual(len(alphas), 50)
        self.assertEqual(len(set(alphas)), 50)
        self.assertTrue({"ABEILST", "ACEINRT"} <= set(alphas))
        self.assertGreaterEqual(plan.cycle_steps, 45)

    def test_queued_bingo_asked_by_cycle_counts(self):
        self.cycle.priority_slots = 0
        self.cycle.save()
        first = build_plan(self.cycle, self.lex, 7, self.today)
        alpha = first.questions.questions_array()[0].alphagram.alphagram
        item = ChallengeQueueItem.objects.create(
            lexicon=self.lex, alphagram=alpha, word_length=7, asks_remaining=2
        )
        # Same cursor, so the same stretch of the cycle.
        plan = build_plan(self.cycle, self.lex, 7, self.today)
        self.assertEqual(plan.asked_ids, [item.pk])

    def test_cycle_visits_every_alphagram_once_per_pass(self):
        n = json.loads(self.lex.lengthCounts)["2"]
        cycle = ChallengeCycle.objects.create(lexicon=self.lex, word_length=2, seed=99)

        def quiz(count):
            cycle.refresh_from_db()
            plan = build_plan(cycle, self.lex, 2, self.today, num_questions=count)
            plan.commit()
            return [q.alphagram.alphagram for q in plan.questions.questions_array()]

        passes = []
        for _ in range(2):
            first, rest = quiz(50), quiz(n - 50)
            self.assertEqual(len(set(first + rest)), n)
            passes.append(set(first))
        cycle.refresh_from_db()
        self.assertEqual(cycle.cursor, 2 * n)
        # The second pass is shuffled anew, not the first one again.
        self.assertNotEqual(passes[0], passes[1])

    def test_quiz_across_passes_has_no_repeats(self):
        n = json.loads(self.lex.lengthCounts)["2"]
        cycle = ChallengeCycle.objects.create(
            lexicon=self.lex, word_length=2, seed=99, cursor=n - 10
        )
        plan = build_plan(cycle, self.lex, 2, self.today, num_questions=50)
        quiz = [q.alphagram.alphagram for q in plan.questions.questions_array()]
        self.assertEqual(len(quiz), 50)
        self.assertEqual(len(set(quiz)), 50)
        self.assertGreaterEqual(plan.cycle_steps, 50)


class ScheduledChallengesOverTimeTest(TestCase):
    """Live challenges played day after day, through the game's own path."""

    fixtures = [
        "test/lexica.yaml",
        "test/users.json",
        "test/profiles.json",
        "challenge_names.json",
    ]
    NEW = ["AEINRST", "ADEGINR"]
    OLD = ["EIKLNST", "AEILNRT", "ADEINRT", "AEILRST"]
    PARTNERS = ["ABEILRT", "AEGILNR", "AEIMNRS"]

    def setUp(self):
        self.user = User.objects.get(username="cesar")
        self.lex = Lexicon.objects.get(lexiconName="NWL20")
        self.sevens = DailyChallengeName.objects.get(name="Today's 7s")
        self.start = timezone.localtime(timezone.now()).date()
        ChallengeCycle.objects.create(
            lexicon=self.lex, word_length=7, seed=42, priority_slots=3
        )
        for alpha in self.NEW:
            ChallengeQueueItem.objects.create(
                lexicon=self.lex,
                alphagram=alpha,
                word_length=7,
                asks_remaining=2,
                new_word=True,
                priority=0,
            )
        for alpha in self.OLD:
            ChallengeQueueItem.objects.create(
                lexicon=self.lex,
                alphagram=alpha,
                word_length=7,
                asks_remaining=1,
                priority=1,
            )

    def play(self, day):
        """Play the live 7s on `day` as if it were today; its questions."""
        now = timezone.now() + timedelta(days=(day - self.start).days)
        partners = questions_from_alphagrams(self.lex, self.PARTNERS)
        with patch(
            "wordwalls.challenge_scheduler.timezone.now", return_value=now
        ), patch("wordwalls.challenge_scheduler.word_search", return_value=partners):
            WordwallsGame().initialize_daily_challenge(
                self.user, self.lex, self.sevens, day
            )
        dc = DailyChallenge.objects.get(lexicon=self.lex, name=self.sevens, date=day)
        return {q["q"]: q["a"] for q in json.loads(dc.alphagrams)}

    def test_queue_drains_in_order_then_cycle_takes_over(self):
        days = [self.start + timedelta(days=i) for i in range(10)]
        played = [self.play(d) for d in days]

        for qs in played:
            self.assertEqual(len(qs), 50)
            self.assertTrue(all(len(a) == 7 and qs[a] for a in qs))
        # Day 1: both new words first, each with an easy partner, then the
        # top old bingo.
        self.assertTrue(set(self.NEW) <= set(played[0]))
        # (A third could turn up through the cycle, by chance.)
        self.assertGreaterEqual(len(set(self.PARTNERS) & set(played[0])), 2)
        self.assertIn(self.OLD[0], played[0])
        self.assertEqual(
            sorted(played[0]["AEINRST"]),
            [
                "ANESTRI",
                "ANTSIER",
                "NASTIER",
                "RATINES",
                "RETAINS",
                "RETINAS",
                "RETSINA",
                "STAINER",
                "STEARIN",
            ],
        )
        # Days 2-7: the new words wait out their week; old bingos go 3 a day.
        self.assertTrue(set(self.OLD[1:]) <= set(played[1]))
        for qs in played[1:7]:
            self.assertFalse(set(self.NEW) & set(qs))
        # Day 8: their second ask, after which the queue is empty.
        self.assertTrue(set(self.NEW) <= set(played[7]))
        self.assertFalse(
            ChallengeQueueItem.objects.filter(asks_remaining__gt=0).exists()
        )
        for item in ChallengeQueueItem.objects.filter(alphagram__in=self.NEW):
            self.assertEqual(item.last_asked, days[7])

        # Every day after the first is all cycle unless a queued bingo or
        # partner was due, and the cycle never repeats an alphagram.
        cycle_only = [
            set(qs) - set(self.NEW) - set(self.OLD) - set(self.PARTNERS)
            for qs in played
        ]
        seen = set()
        for qs in cycle_only:
            self.assertFalse(seen & qs)
            seen |= qs
        self.assertEqual(len(cycle_only[8]), 50)

    def test_reopening_a_day_doesnt_ask_again(self):
        first = self.play(self.start)
        cursor = ChallengeCycle.objects.get().cursor
        self.assertEqual(self.play(self.start), first)
        self.assertEqual(ChallengeCycle.objects.get().cursor, cursor)
        self.assertEqual(
            ChallengeQueueItem.objects.get(alphagram="AEINRST").asks_remaining, 1
        )

    def test_built_queue_feeds_the_next_challenge(self):
        ChallengeQueueItem.objects.all().delete()
        bingos = {7: [("EIKLNST", "TINKLES", True)], 8: []}
        with patch(
            "wordwalls.challenge_queue.current_bingos",
            side_effect=lambda lex, length: bingos[length],
        ):
            call_command(
                "build_challenge_queue", "NWL20", "--players", "50", stdout=StringIO()
            )
        item = ChallengeQueueItem.objects.get()
        self.assertEqual(item.asks_remaining, 2)
        self.assertIn("EIKLNST", self.play(self.start))
        item.refresh_from_db()
        self.assertEqual((item.asks_remaining, item.last_asked), (1, self.start))


class LoadChallengeQueueTest(TestCase):
    fixtures = ["test/lexica.yaml"]

    def load(self, rows, *args):
        with tempfile.NamedTemporaryFile("w", suffix=".csv", delete=False) as f:
            f.write("alphagram,asks_needed,new_word\n")
            f.write("".join(f"{a},{n},{w}\n" for a, n, w in rows))
        out = StringIO()
        call_command("load_challenge_queue", "NWL20", f.name, *args, stdout=out)
        os.unlink(f.name)
        return out.getvalue()

    def test_load_and_reload(self):
        out = self.load(
            [
                ("AEINRST", 2, 1),
                ("ADEGINR", 3, 0),
                ("ABEILRST", 2, 0),
                ("EIKLNST", 0, 0),
            ],
            "--slots",
            4,
        )
        self.assertIn("NWL20 7s: 2 bingos, 5 asks queued, 4/challenge -> ~2 days", out)
        self.assertIn("NWL20 8s: 1 bingos, 2 asks queued", out)
        new = ChallengeQueueItem.objects.get(alphagram="AEINRST")
        self.assertEqual((new.priority, new.new_word), (0, True))
        self.assertEqual(
            ChallengeQueueItem.objects.get(alphagram="ADEGINR").priority, 1
        )
        self.assertFalse(
            ChallengeQueueItem.objects.filter(alphagram="EIKLNST").exists()
        )
        seed = ChallengeCycle.objects.get(word_length=7).seed

        # Reloading updates counts in place and keeps each cycle's seed.
        self.load([("AEINRST", 1, 1)])
        self.assertEqual(
            ChallengeQueueItem.objects.get(alphagram="AEINRST").asks_remaining, 1
        )
        self.assertEqual(ChallengeQueueItem.objects.count(), 3)
        self.assertEqual(ChallengeCycle.objects.get(word_length=7).seed, seed)
        self.assertEqual(ChallengeCycle.objects.get(word_length=7).priority_slots, 4)

        self.load([("AEINRST", 1, 1)], "--replace")
        self.assertEqual(ChallengeQueueItem.objects.count(), 1)


class BuildChallengeQueueTest(TestCase):
    fixtures = ["test/lexica.yaml", "test/users.json", "challenge_names.json"]

    def setUp(self):
        self.nwl = Lexicon.objects.get(lexiconName="NWL20")
        self.csw = Lexicon.objects.get(lexiconName="CSW21")
        self.sevens = DailyChallengeName.objects.get(name="Today's 7s")
        self.users = list(User.objects.all()[:4])

    def challenge(self, lex, day, questions, scores, missed):
        dc = DailyChallenge.objects.create(
            lexicon=lex,
            name=self.sevens,
            date=day,
            seconds=270,
            alphagrams=json.dumps([{"q": q, "a": a} for q, a in questions]),
        )
        lb = DailyChallengeLeaderboard.objects.create(challenge=dc, maxScore=50)
        for user, score in zip(self.users, scores):
            DailyChallengeLeaderboardEntry.objects.create(
                board=lb, user=user, score=score, timeRemaining=0
            )
        for alpha, times in missed.items():
            DailyChallengeMissedBingos.objects.create(
                challenge=dc, alphagram_string=alpha, numTimesMissed=times
            )

    def test_collect_asks(self):
        today = timezone.localtime(timezone.now()).date()
        # One zero-scorer, who counts as neither a player nor a miss.
        self.challenge(
            self.nwl,
            today,
            [("AEINRST", ["RETAINS", "NASTIER"]), ("ADEGINR", ["READING"])],
            [0, 30, 40],
            {"AEINRST": 2, "ADEGINR": 1},
        )
        self.challenge(self.csw, today, [("ADEGINR", ["READING"])], [30], {})
        asks = collect_asks(lexicon_ids(("NWL",)))
        self.assertEqual(
            asks,
            {("AEINRST", "NASTIER RETAINS"): [2, 1], ("ADEGINR", "READING"): [2, 0]},
        )
        asks = collect_asks(lexicon_ids(("CSW", "NWL")))
        self.assertEqual(asks[("ADEGINR", "READING")], [3, 0])
        self.assertEqual(typical_turnout(lexicon_ids(("CSW",)), today)[7], 1)

    def test_compute_needs(self):
        asks = {
            ("AEINRST", "RETAINS"): [1000, 300],
            ("ADEGINR", "READING"): [30, 10],
            ("EIKLNST", "TINKLES"): [500, 100],
        }
        bingos = [
            ("AEINRST", "RETAINS", False),
            ("ADEGINR", "READING", False),
            # Gained an anagram since: the old data doesn't count.
            ("EIKLNST", "KELTINS TINKLES", True),
            ("ABEILST", "BASTILE", False),
        ]
        needs = {nd.alphagram: nd for nd in compute_needs(bingos, asks, 40)}
        self.assertEqual(set(needs), {"ADEGINR", "EIKLNST", "ABEILST"})
        self.assertEqual(needs["ADEGINR"].asks_needed, 1)
        self.assertEqual(needs["EIKLNST"].asks_needed, 2)
        self.assertTrue(needs["EIKLNST"].new_word)
        self.assertEqual(
            [nd.alphagram for nd in compute_needs(bingos, asks, 40)][0], "EIKLNST"
        )

    def test_command_prunes_and_keeps_last_asked(self):
        last = timezone.localtime(timezone.now()).date() - timedelta(days=2)
        ChallengeQueueItem.objects.create(
            lexicon=self.nwl,
            alphagram="ADEGINR",
            word_length=7,
            asks_remaining=1,
            last_asked=last,
        )
        ChallengeQueueItem.objects.create(
            lexicon=self.nwl, alphagram="AEINRST", word_length=7, asks_remaining=1
        )
        bingos = {
            7: [("ADEGINR", "READING", True), ("EIKLNST", "TINKLES", False)],
            8: [],
        }
        out = StringIO()
        with patch(
            "wordwalls.challenge_queue.current_bingos",
            side_effect=lambda lex, length: bingos[length],
        ):
            call_command("build_challenge_queue", "NWL20", "--dry-run", stdout=out)
            self.assertEqual(ChallengeQueueItem.objects.count(), 2)
            self.assertIn("2 bingos short of data (1 with new words)", out.getvalue())
            call_command("build_challenge_queue", "NWL20", stdout=out)
        self.assertEqual(
            set(ChallengeQueueItem.objects.values_list("alphagram", flat=True)),
            {"ADEGINR", "EIKLNST"},
        )
        kept = ChallengeQueueItem.objects.get(alphagram="ADEGINR")
        self.assertEqual(
            (kept.last_asked, kept.new_word, kept.priority), (last, True, 0)
        )
        self.assertTrue(ChallengeCycle.objects.filter(lexicon=self.nwl).exists())
