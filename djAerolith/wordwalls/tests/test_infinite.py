# -*- coding: utf-8 -*-
"""
Tests for the Great Wall.

The word server is mocked throughout, so these need no running word_db_server --
unlike test_game_logic.py, which talks to the real service.
"""

import base64
import importlib
import logging
from datetime import timedelta
from math import ceil
from unittest import mock

from django.apps import apps
from django.contrib.auth.models import User
from django.db import connection
from django.test import SimpleTestCase, TestCase
from django.test.utils import CaptureQueriesContext
from django.urls import reverse
from django.utils import timezone

from base.models import Lexicon
from lib.domain import Alphagram, Question, Questions, Word
from wordwalls.infinite_game import (
    InfiniteWallError,
    InfiniteWallGame,
    leaderboards,
)
from wordwalls.infinite_models import InfiniteWall, InfiniteWallChunk
from wordwalls.infinite_perm import (
    DEFAULT_CHUNK_H,
    DEFAULT_CHUNK_SIZE,
    DEFAULT_CHUNK_W,
    WallGeometry,
    WallPermutation,
    assemble_bitmap,
    bitmap_size,
    chunk_cols_for,
    get_bit,
    padded,
    popcount,
    set_bit,
    word_bits,
)

logger = logging.getLogger(__name__)

WORDS_PER_ALPHAGRAM = 2


def alphagram_for(probability):
    return "A{0:05d}".format(probability)


def word_for(probability, index):
    return "W{0:05d}{1}".format(probability, index)


def fake_wdb_response(probabilities, words_per=WORDS_PER_ALPHAGRAM):
    """
    Stand in for the word server.

    Deliberately returns ascending probability order rather than the order asked
    for, because that is what the real service does (`ORDER BY
    alphagrams.probability` in word_db_server's query generator). Any code that
    assumes request order will fail against this.
    """
    questions = Questions()
    for probability in sorted(probabilities):
        questions.append(
            Question(
                alphagram=Alphagram(
                    alphagram_for(probability), probability=probability
                ),
                answers=[
                    Word(word=word_for(probability, i), lexicon_symbols="")
                    for i in range(words_per)
                ],
            )
        )
    return questions


class WallPermutationTest(SimpleTestCase):
    def assert_bijection(self, n, seed):
        """Every cell maps to a distinct rank, and every rank is produced."""
        perm = WallPermutation(seed, n)
        ranks = [perm.forward(cell) for cell in range(n)]
        msg = "n={0} seed={1}".format(n, seed)
        # Checks all three failure modes at once: out of range, duplicated, and
        # missing. A plain hash would fail the latter two.
        self.assertEqual(len(ranks), n, msg)
        self.assertEqual(len(set(ranks)), n, "duplicated ranks: " + msg)
        self.assertEqual(set(ranks), set(range(n)), "missing ranks: " + msg)

    def test_is_a_bijection(self):
        for n in (1, 2, 7, 100, 999, 1000, 2861, 21223):
            self.assert_bijection(n, 0xDEADBEEF)

    def test_is_a_bijection_for_every_small_wall(self):
        # Sweep rather than sample: small n is where an off-by-one in the block
        # width or the cycle walk would show up.
        for n in range(1, 40):
            for seed in (0, 1, 12345):
                self.assert_bijection(n, seed)

    def test_is_a_bijection_across_block_width_changes(self):
        # The Feistel block is sized from n's bit length, so the width changes
        # at each power of two -- and with it how often the cycle walk fires.
        for power in range(1, 11):
            for n in (2**power - 1, 2**power, 2**power + 1):
                self.assert_bijection(n, 99)

    def test_is_a_bijection_when_no_cycle_walking_is_needed(self):
        # n = 256 makes the block domain exactly 256, so forward() never has to
        # walk -- a distinct path from every other size.
        perm = WallPermutation(7, 256)
        self.assertEqual(perm.half, 4)
        self.assertEqual(1 << (2 * perm.half), 256)
        self.assert_bijection(256, 7)

    def test_is_a_bijection_for_extreme_seeds(self):
        for seed in (0, 1, 2**31, 2**63 - 1, 0xFFFFFFFFFFFFFFFF):
            self.assert_bijection(1000, seed)

    def test_inverse_round_trips(self):
        for n in (1, 2, 7, 100, 1000, 2861):
            perm = WallPermutation(12345, n)
            for cell in range(n):
                self.assertEqual(perm.inverse(perm.forward(cell)), cell)

    def test_is_stable_for_a_given_seed(self):
        # A wall stays open for hours and across deploys; the mapping must not
        # drift between two separately constructed permutations.
        first = WallPermutation(777, 21223)
        second = WallPermutation(777, 21223)
        self.assertEqual(
            [first.forward(i) for i in range(50)],
            [second.forward(i) for i in range(50)],
        )

    def test_different_seeds_give_different_walls(self):
        self.assertNotEqual(
            [WallPermutation(1, 21223).forward(i) for i in range(20)],
            [WallPermutation(2, 21223).forward(i) for i in range(20)],
        )

    def test_actually_shuffles(self):
        # A wall in probability order would let players farm the easy corner, so
        # assert the mapping is not the identity.
        perm = WallPermutation(99, 21223)
        identity = sum(1 for i in range(500) if perm.forward(i) == i)
        self.assertLess(identity, 10)

    def test_probabilities_for_cells_are_one_based(self):
        perm = WallPermutation(5, 100)
        probabilities, prob_to_cell = perm.probabilities_for_cells(range(100))
        self.assertEqual(sorted(probabilities), list(range(1, 101)))
        self.assertEqual(len(prob_to_cell), 100)
        for probability, cell in prob_to_cell.items():
            self.assertEqual(perm.forward(cell) + 1, probability)

    def test_rejects_empty_wall(self):
        with self.assertRaises(ValueError):
            WallPermutation(1, 0)


class BitmapTest(SimpleTestCase):
    def test_size(self):
        self.assertEqual(bitmap_size(0), 0)
        self.assertEqual(bitmap_size(1), 1)
        self.assertEqual(bitmap_size(8), 1)
        self.assertEqual(bitmap_size(9), 2)
        self.assertEqual(bitmap_size(21223), 2653)

    def test_set_and_get(self):
        buf = bytearray(bitmap_size(100))
        self.assertFalse(get_bit(buf, 42))
        set_bit(buf, 42)
        self.assertTrue(get_bit(buf, 42))
        # Setting one bit must not disturb its neighbours.
        self.assertFalse(get_bit(buf, 41))
        self.assertFalse(get_bit(buf, 43))

    def test_bits_are_lsb_first(self):
        # The TS side (infinite/geometry.ts getBit) depends on this layout.
        buf = bytearray(1)
        set_bit(buf, 0)
        self.assertEqual(buf[0], 0b00000001)
        set_bit(buf, 7)
        self.assertEqual(buf[0], 0b10000001)


class WallGeometryTest(SimpleTestCase):
    def test_chunk_cols_aims_for_a_wide_wall(self):
        # NWL23 sevens: 21223 alphagrams -> 166 rectangles -> 25 across.
        self.assertEqual(chunk_cols_for(166), 25)
        self.assertEqual(chunk_cols_for(23), 9)
        self.assertEqual(chunk_cols_for(1), 1)

    def test_known_wall_shapes(self):
        for n, cols, width, height in (
            (2861, 9, 72, 48),  # NWL23 fours
            (21223, 25, 200, 112),  # NWL23 sevens
            (247400, 87, 696, 368),  # OSPS52 nines
        ):
            geometry = WallGeometry(n, chunk_cols_for(ceil(n / DEFAULT_CHUNK_SIZE)))
            self.assertEqual(geometry.chunk_cols, cols)
            self.assertEqual(geometry.width, width)
            self.assertEqual(geometry.height, height)
            self.assertGreaterEqual(geometry.num_chunks * DEFAULT_CHUNK_SIZE, n)

    def test_cell_xy_round_trips(self):
        geometry = WallGeometry(21223, 25)
        for cell in range(0, 21223, 89):
            x, y = geometry.cell_to_xy(cell)
            self.assertEqual(geometry.xy_to_cell(x, y), cell)
            self.assertLess(x, geometry.width)
            self.assertLess(y, geometry.height)

    def test_chunks_partition_the_wall_exactly(self):
        geometry = WallGeometry(2861, 9)
        seen = []
        for chunk in range(geometry.num_chunks):
            seen.extend(geometry.cells_in_chunk(chunk))
        self.assertEqual(seen, list(range(2861)))

    def test_last_chunk_is_partial(self):
        # 2861 = 22 full rectangles of 128 + 45 cells.
        geometry = WallGeometry(2861, 9)
        self.assertEqual(geometry.num_chunks, 23)
        self.assertEqual(len(geometry.cells_in_chunk(0)), DEFAULT_CHUNK_SIZE)
        self.assertEqual(len(geometry.cells_in_chunk(22)), 45)

    def test_valid_chunk(self):
        geometry = WallGeometry(300, 1)
        self.assertEqual(geometry.num_chunks, 3)
        self.assertTrue(geometry.valid_chunk(0))
        self.assertTrue(geometry.valid_chunk(2))
        self.assertFalse(geometry.valid_chunk(3))
        self.assertFalse(geometry.valid_chunk(-1))
        self.assertFalse(geometry.valid_chunk("0"))

    def test_chunk_footprint_matches_the_board(self):
        self.assertEqual(DEFAULT_CHUNK_W * DEFAULT_CHUNK_H, DEFAULT_CHUNK_SIZE)
        self.assertEqual(DEFAULT_CHUNK_SIZE, 128)
        # 8 wide x 16 tall renders 1408x480 px, which fits a monitor near 1:1.
        self.assertEqual((DEFAULT_CHUNK_W, DEFAULT_CHUNK_H), (8, 16))


class OlderWallShapeTest(SimpleTestCase):
    """
    Geometry is frozen per wall, so retuning the module defaults must not
    re-interpret a wall already in progress.

    The bug this guards: rectangle N used to mean cells 100N..100N+99. Changing
    the defaults to 8x16 silently made it mean 128N..128N+127, so every stored
    solve pointed into the wrong rectangle -- the minimap painted cells solved
    that a freshly materialized rectangle then served as unsolved questions, and
    chunk rows past the new num_chunks became unreachable.
    """

    # The original 5x20 = 100 shape, as walls built before the change carry it.
    OLD_W, OLD_H = 5, 20

    def old_wall(self):
        return WallGeometry(21223, 41, self.OLD_W, self.OLD_H)

    def test_keeps_its_own_rectangle_size(self):
        geometry = self.old_wall()
        self.assertEqual(geometry.chunk_size, 100)
        self.assertEqual(geometry.num_chunks, 213)
        # Today's default differs, which is exactly the hazard.
        self.assertNotEqual(geometry.chunk_size, DEFAULT_CHUNK_SIZE)

    def test_cells_resolve_with_the_old_size(self):
        geometry = self.old_wall()
        # Cell 12900 was the first cell of old rectangle 129.
        self.assertEqual(geometry.cells_in_chunk(129)[0], 12900)
        self.assertEqual(len(geometry.cells_in_chunk(129)), 100)

    def test_coordinates_round_trip_under_the_old_shape(self):
        geometry = self.old_wall()
        for cell in range(0, geometry.n, 401):
            x, y = geometry.cell_to_xy(cell)
            self.assertEqual(geometry.xy_to_cell(x, y), cell)

    def test_chunks_still_partition_exactly(self):
        geometry = self.old_wall()
        seen = []
        for chunk in range(geometry.num_chunks):
            seen.extend(geometry.cells_in_chunk(chunk))
        self.assertEqual(seen, list(range(geometry.n)))

    def test_chunk_cols_for_respects_the_shape(self):
        # Same rectangle count, different rectangle shape, different wall width.
        self.assertEqual(chunk_cols_for(213, self.OLD_W, self.OLD_H), 41)
        self.assertEqual(chunk_cols_for(213, DEFAULT_CHUNK_W, DEFAULT_CHUNK_H), 29)


class InfiniteWallTestBase(TestCase):
    fixtures = [
        "test/lexica.yaml",
        "test/users.json",
        "test/profiles.json",
    ]

    def setUp(self):
        self.user = User.objects.get(username="cesar")
        self.other_user = User.objects.exclude(username="cesar").first()
        self.lexicon = Lexicon.objects.get(lexiconName="NWL23")
        self.game = InfiniteWallGame()

    def make_wall(self, n, chunk_cols=1, state=InfiniteWall.RUNNING, user=None):
        """A wall of an arbitrary size, so completion is testable in a few guesses."""
        return InfiniteWall.objects.create(
            user=user or self.user,
            lexicon=self.lexicon,
            word_length=7,
            num_alphagrams=n,
            chunk_w=DEFAULT_CHUNK_W,
            chunk_h=DEFAULT_CHUNK_H,
            chunk_cols=chunk_cols,
            seed=4242,
            state=state,
            resumed_at=timezone.now() if state == InfiniteWall.RUNNING else None,
        )

    def patch_wdb(self):
        """Patch both word-server entry points, returning the two mocks."""
        search = mock.patch(
            "wordwalls.infinite_game.questions_from_probability_list",
            side_effect=lambda lex, probs, wl, expand=False: fake_wdb_response(probs),
        )
        expand = mock.patch(
            "wordwalls.infinite_game.questions_from_alpha_dicts",
            side_effect=lambda lex, alphas: fake_wdb_response(
                [int(a["q"][1:]) for a in alphas]
            ),
        )
        return search.start(), expand.start()

    def tearDown(self):
        mock.patch.stopall()

    def cell_solved(self, wall, g):
        """Read a cell the way the client does: off the assembled bitmap."""
        return get_bit(base64.b64decode(self.game.bitmap(wall)["solvedBitmap"]), g)

    def solve_chunk(self, wall, chunk_index):
        """Guess every outstanding word in a rectangle."""
        chunk = InfiniteWallChunk.objects.get(wall=wall, chunk_index=chunk_index)
        for entry in list(chunk.answers):
            for word in entry["a"]:
                self.game.guess(wall, chunk_index, word)


class InfiniteWallCreationTest(InfiniteWallTestBase):
    def test_create_freezes_the_rectangle_shape(self):
        wall = self.game.create(self.user, self.lexicon, 7)
        # Stored, not read from the module at render time.
        self.assertEqual(wall.chunk_w, DEFAULT_CHUNK_W)
        self.assertEqual(wall.chunk_h, DEFAULT_CHUNK_H)
        geometry = self.game.geometry(wall)
        self.assertEqual(geometry.chunk_size, DEFAULT_CHUNK_SIZE)

    def test_geometry_follows_the_wall_not_the_defaults(self):
        wall = self.game.create(self.user, self.lexicon, 7)
        # Simulate a wall built under the older 5x20 shape.
        wall.chunk_w, wall.chunk_h, wall.chunk_cols = 5, 20, 41
        geometry = self.game.geometry(wall)
        self.assertEqual(geometry.chunk_size, 100)
        self.assertEqual(geometry.num_chunks, 213)
        self.assertEqual(geometry.cells_in_chunk(129)[0], 12900)

    def test_create_reads_length_counts(self):
        wall = self.game.create(self.user, self.lexicon, 7)
        self.assertEqual(wall.num_alphagrams, 21223)
        self.assertEqual(wall.chunk_cols, 25)
        self.assertEqual(wall.state, InfiniteWall.NOT_STARTED)
        self.assertEqual(wall.solved_count, 0)

    def test_create_rejects_bad_length(self):
        for length in (3, 10, 0):
            with self.assertRaises(InfiniteWallError):
                self.game.create(self.user, self.lexicon, length)

    def test_every_supported_length_builds(self):
        for length in (4, 5, 6, 7, 8, 9):
            wall = self.game.create(self.user, self.lexicon, length)
            self.assertGreater(wall.num_alphagrams, 0)
            geometry = self.game.geometry(wall)
            self.assertGreaterEqual(
                geometry.num_chunks * DEFAULT_CHUNK_SIZE, wall.num_alphagrams
            )


class InfiniteWallAccessTest(InfiniteWallTestBase):
    def test_owner_can_fetch(self):
        wall = self.make_wall(200)
        self.assertEqual(self.game.get_wall(wall.pk, self.user).pk, wall.pk)

    def test_other_user_is_denied(self):
        wall = self.make_wall(200)
        with self.assertRaises(InfiniteWallError):
            self.game.get_wall(wall.pk, self.other_user)

    def test_missing_wall(self):
        with self.assertRaises(InfiniteWallError):
            self.game.get_wall(123456789, self.user)


class InfiniteWallClockTest(InfiniteWallTestBase):
    def test_running_clock_accrues(self):
        wall = self.make_wall(200)
        wall.elapsed_ms = 5000
        wall.resumed_at = timezone.now() - timedelta(seconds=30)
        elapsed = self.game.elapsed_ms(wall)
        self.assertGreaterEqual(elapsed, 34900)
        self.assertLess(elapsed, 36000)

    def test_pause_folds_and_freezes(self):
        wall = self.make_wall(200)
        wall.resumed_at = timezone.now() - timedelta(seconds=12)
        wall.save()

        self.game.pause(wall)
        wall.refresh_from_db()
        self.assertEqual(wall.state, InfiniteWall.PAUSED)
        self.assertIsNone(wall.resumed_at)
        self.assertIsNone(wall.active_chunk)
        frozen = wall.elapsed_ms
        self.assertGreaterEqual(frozen, 11900)

        # The clock must not move while paused.
        self.assertEqual(self.game.elapsed_ms(wall), frozen)

    def test_resume_restarts_the_clock(self):
        wall = self.make_wall(200, state=InfiniteWall.PAUSED)
        wall.elapsed_ms = 8000
        wall.save()

        self.game.resume(wall)
        wall.refresh_from_db()
        self.assertEqual(wall.state, InfiniteWall.RUNNING)
        self.assertIsNotNone(wall.resumed_at)
        self.assertGreaterEqual(self.game.elapsed_ms(wall), 8000)

    def test_pause_and_resume_are_idempotent(self):
        wall = self.make_wall(200, state=InfiniteWall.PAUSED)
        wall.elapsed_ms = 3000
        wall.save()
        self.game.pause(wall)
        self.assertEqual(wall.elapsed_ms, 3000)
        self.game.resume(wall)
        first_resumed_at = wall.resumed_at
        self.game.resume(wall)
        self.assertEqual(wall.resumed_at, first_resumed_at)

    def test_resume_refuses_a_finished_wall(self):
        wall = self.make_wall(200, state=InfiniteWall.DONE)
        with self.assertRaises(InfiniteWallError):
            self.game.resume(wall)


class InfiniteWallHeartbeatTest(InfiniteWallTestBase):
    """
    The clock runs only while a rectangle is open, so a wall left RUNNING means
    either a live tab elsewhere or a browser that went away. The heartbeat is
    what tells those apart.
    """

    def test_heartbeat_keeps_a_wall_alive(self):
        wall = self.make_wall(200)
        InfiniteWall.objects.filter(pk=wall.pk).update(
            last_activity=timezone.now() - timedelta(seconds=60)
        )
        wall.refresh_from_db()

        self.game.heartbeat(wall)
        wall.refresh_from_db()
        self.assertLess((timezone.now() - wall.last_activity).total_seconds(), 5)
        self.assertFalse(self.game.reap_if_stale(wall))
        self.assertEqual(wall.state, InfiniteWall.RUNNING)

    def test_recent_wall_is_not_reaped(self):
        wall = self.make_wall(200)
        self.assertFalse(self.game.reap_if_stale(wall))
        self.assertEqual(wall.state, InfiniteWall.RUNNING)

    def test_silent_wall_is_paused(self):
        wall = self.make_wall(200)
        InfiniteWall.objects.filter(pk=wall.pk).update(
            resumed_at=timezone.now() - timedelta(hours=8),
            last_activity=timezone.now() - timedelta(hours=8) + timedelta(minutes=5),
        )
        wall.refresh_from_db()

        self.assertTrue(self.game.reap_if_stale(wall))
        wall.refresh_from_db()
        self.assertEqual(wall.state, InfiniteWall.PAUSED)
        self.assertIsNone(wall.resumed_at)
        self.assertIsNone(wall.active_chunk)

    def test_reaping_credits_only_up_to_the_last_heartbeat(self):
        """Shutting a laptop should cost the heartbeat gap, not the hours since."""
        wall = self.make_wall(200)
        InfiniteWall.objects.filter(pk=wall.pk).update(
            resumed_at=timezone.now() - timedelta(hours=8),
            last_activity=timezone.now() - timedelta(hours=8) + timedelta(minutes=5),
        )
        wall.refresh_from_db()

        self.game.reap_if_stale(wall)
        wall.refresh_from_db()
        # Five minutes of real play, not the eight hours the tab sat dead.
        self.assertAlmostEqual(wall.elapsed_ms, 5 * 60 * 1000, delta=2000)

    def test_reaping_never_credits_negative_time(self):
        # last_activity can predate resumed_at for a wall resumed then abandoned.
        wall = self.make_wall(200)
        InfiniteWall.objects.filter(pk=wall.pk).update(
            resumed_at=timezone.now() - timedelta(minutes=1),
            last_activity=timezone.now() - timedelta(minutes=10),
        )
        wall.refresh_from_db()

        self.game.reap_if_stale(wall)
        wall.refresh_from_db()
        self.assertEqual(wall.elapsed_ms, 0)

    def test_paused_wall_is_left_alone(self):
        wall = self.make_wall(200, state=InfiniteWall.PAUSED)
        InfiniteWall.objects.filter(pk=wall.pk).update(
            last_activity=timezone.now() - timedelta(hours=8)
        )
        wall.refresh_from_db()
        self.assertFalse(self.game.reap_if_stale(wall))

    def test_heartbeat_on_a_paused_wall_does_not_restart_it(self):
        wall = self.make_wall(200, state=InfiniteWall.PAUSED)
        status = self.game.heartbeat(wall)
        self.assertEqual(status["state"], InfiniteWall.PAUSED)


class InfiniteWallChunkLoadTest(InfiniteWallTestBase):
    def test_load_chunk_reorders_response_into_cell_order(self):
        """
        The regression this guards: PROBABILITY_LIST answers in probability order,
        not the order asked for, so a shuffled wall must re-sort by cell.
        """
        self.patch_wdb()
        wall = self.make_wall(200)
        payload = self.game.load_chunk(wall, 0)

        cells = [q["g"] for q in payload["questions"]]
        self.assertEqual(cells, list(range(DEFAULT_CHUNK_SIZE)))

        perm = self.game.permutation(wall)
        for question in payload["questions"]:
            expected_probability = perm.forward(question["g"]) + 1
            self.assertEqual(question["a"], alphagram_for(expected_probability))

    def test_first_visit_costs_one_word_server_call(self):
        search, expand = self.patch_wdb()
        wall = self.make_wall(200)
        self.game.load_chunk(wall, 0)
        self.assertEqual(search.call_count, 1)
        self.assertEqual(expand.call_count, 0)

    def test_revisit_uses_expand_and_persists_nothing_new(self):
        search, expand = self.patch_wdb()
        wall = self.make_wall(200)
        self.game.load_chunk(wall, 0)
        self.game.load_chunk(wall, 0)
        self.assertEqual(search.call_count, 1)
        self.assertEqual(expand.call_count, 1)
        self.assertEqual(InfiniteWallChunk.objects.filter(wall=wall).count(), 1)

    def test_load_chunk_sets_active_chunk(self):
        self.patch_wdb()
        wall = self.make_wall(300)
        self.game.load_chunk(wall, 2)
        wall.refresh_from_db()
        self.assertEqual(wall.active_chunk, 2)

    def test_load_chunk_rejects_out_of_range(self):
        self.patch_wdb()
        wall = self.make_wall(200)
        for bad in (2, -1, 99):
            with self.assertRaises(InfiniteWallError):
                self.game.load_chunk(wall, bad)

    def test_load_chunk_refused_while_paused(self):
        self.patch_wdb()
        wall = self.make_wall(200, state=InfiniteWall.PAUSED)
        with self.assertRaises(InfiniteWallError):
            self.game.load_chunk(wall, 0)

    def test_partial_last_chunk(self):
        self.patch_wdb()
        wall = self.make_wall(150)
        payload = self.game.load_chunk(wall, 1)
        self.assertEqual(len(payload["questions"]), 22)
        self.assertEqual(
            [q["g"] for q in payload["questions"]], list(range(128, 150))
        )

    def test_answerless_cells_are_credited_so_the_wall_stays_completable(self):
        # A cell whose alphagram the lexicon has no words for can never be
        # guessed, so it must not block completion.
        mock.patch(
            "wordwalls.infinite_game.questions_from_probability_list",
            side_effect=lambda lex, probs, wl, expand=False: fake_wdb_response(
                sorted(probs)[:-3]
            ),
        ).start()
        mock.patch(
            "wordwalls.infinite_game.questions_from_alpha_dicts",
            side_effect=lambda lex, alphas: fake_wdb_response(
                [int(a["q"][1:]) for a in alphas]
            ),
        ).start()

        wall = self.make_wall(100)
        payload = self.game.load_chunk(wall, 0)
        self.assertEqual(len(payload["questions"]), 97)
        wall.refresh_from_db()
        self.assertEqual(wall.solved_count, 3)


class InfiniteWallGuessTest(InfiniteWallTestBase):
    def setUp(self):
        super().setUp()
        self.patch_wdb()

    def first_entry(self, wall, chunk_index=0):
        chunk = InfiniteWallChunk.objects.get(wall=wall, chunk_index=chunk_index)
        return chunk.answers[0]

    def test_partial_alphagram_is_not_credited(self):
        wall = self.make_wall(200)
        self.game.load_chunk(wall, 0)
        entry = self.first_entry(wall)

        result = self.game.guess(wall, 0, entry["a"][0])
        self.assertEqual(result["alphagram"], entry["q"])
        self.assertFalse(result["alphagramSolved"])
        wall.refresh_from_db()
        self.assertEqual(wall.solved_count, 0)
        self.assertFalse(self.cell_solved(wall, entry["g"]))

    def test_full_alphagram_sets_the_bit(self):
        wall = self.make_wall(200)
        self.game.load_chunk(wall, 0)
        entry = self.first_entry(wall)

        for word in entry["a"]:
            result = self.game.guess(wall, 0, word)
        self.assertTrue(result["alphagramSolved"])
        wall.refresh_from_db()
        self.assertEqual(wall.solved_count, 1)
        self.assertTrue(self.cell_solved(wall, entry["g"]))

    def test_repeat_guess_is_already_solved_and_does_not_double_count(self):
        wall = self.make_wall(200)
        self.game.load_chunk(wall, 0)
        entry = self.first_entry(wall)

        self.game.guess(wall, 0, entry["a"][0])
        result = self.game.guess(wall, 0, entry["a"][0])
        self.assertTrue(result["alreadySolved"])
        chunk = InfiniteWallChunk.objects.get(wall=wall, chunk_index=0)
        self.assertEqual(popcount(chunk.solved_word_bits), 1)

    def test_guess_is_case_insensitive_and_trimmed(self):
        wall = self.make_wall(200)
        self.game.load_chunk(wall, 0)
        entry = self.first_entry(wall)
        result = self.game.guess(wall, 0, "  {0}  ".format(entry["a"][0].lower()))
        self.assertEqual(result["word"], entry["a"][0])

    def test_unknown_word_is_a_miss_not_an_error(self):
        wall = self.make_wall(200)
        self.game.load_chunk(wall, 0)
        result = self.game.guess(wall, 0, "NOTAWORD")
        self.assertIsNone(result["alphagram"])
        self.assertFalse(result["alreadySolved"])

    def test_guess_on_an_inactive_chunk_is_refused(self):
        wall = self.make_wall(300)
        self.game.load_chunk(wall, 0)
        entry = self.first_entry(wall)
        self.game.load_chunk(wall, 1)  # active_chunk moves to 1
        with self.assertRaises(InfiniteWallError):
            self.game.guess(wall, 0, entry["a"][0])

    def test_guess_refused_while_paused(self):
        wall = self.make_wall(200)
        self.game.load_chunk(wall, 0)
        entry = self.first_entry(wall)
        self.game.pause(wall)
        with self.assertRaises(InfiniteWallError):
            self.game.guess(wall, 0, entry["a"][0])

    def test_resumed_chunk_omits_words_already_found(self):
        wall = self.make_wall(200)
        self.game.load_chunk(wall, 0)
        entry = self.first_entry(wall)
        self.game.guess(wall, 0, entry["a"][0])

        payload = self.game.load_chunk(wall, 0)
        packet = next(q for q in payload["questions"] if q["a"] == entry["q"])
        words = [w["w"] for w in packet["ws"]]
        # The found word is gone, so the remaining-answers chip is right for free
        # and a resume never ships back an answer the player already has.
        self.assertNotIn(entry["a"][0], words)
        self.assertIn(entry["a"][1], words)

    def test_resumed_chunk_omits_finished_alphagrams(self):
        wall = self.make_wall(200)
        self.game.load_chunk(wall, 0)
        entry = self.first_entry(wall)
        for word in entry["a"]:
            self.game.guess(wall, 0, word)

        payload = self.game.load_chunk(wall, 0)
        self.assertEqual(len(payload["questions"]), DEFAULT_CHUNK_SIZE - 1)
        self.assertNotIn(entry["q"], [q["a"] for q in payload["questions"]])

    def test_clearing_the_wall_finishes_it(self):
        wall = self.make_wall(3)
        self.game.load_chunk(wall, 0)
        self.solve_chunk(wall, 0)

        wall.refresh_from_db()
        self.assertEqual(wall.solved_count, 3)
        self.assertEqual(wall.state, InfiniteWall.DONE)
        self.assertIsNotNone(wall.completed)
        self.assertIsNone(wall.resumed_at)
        self.assertIsNone(wall.active_chunk)
        # The finishing time is frozen for a future leaderboard to read.
        self.assertGreater(wall.elapsed_ms, 0)
        self.assertEqual(self.game.elapsed_ms(wall), wall.elapsed_ms)

    def test_progress_survives_a_reload(self):
        wall = self.make_wall(200)
        self.game.load_chunk(wall, 0)
        entry = self.first_entry(wall)
        for word in entry["a"]:
            self.game.guess(wall, 0, word)
        self.game.pause(wall)

        reloaded = self.game.get_wall(wall.pk, self.user)
        self.assertEqual(reloaded.solved_count, 1)
        self.assertTrue(self.cell_solved(reloaded, entry["g"]))
        self.assertEqual(reloaded.state, InfiniteWall.PAUSED)


class InfiniteWallPayloadTest(InfiniteWallTestBase):
    def test_wall_detail_shape(self):
        self.patch_wdb()
        wall = self.make_wall(200)
        detail = self.game.wall_detail(wall)
        for key in (
            "wallId",
            "lexicon",
            "wordLength",
            "numAlphagrams",
            "chunkCols",
            "chunkRows",
            "numChunks",
            "chunkWidth",
            "chunkHeight",
            "width",
            "height",
            "solvedBitmap",
            "state",
            "elapsedMs",
            "solvedCount",
            "activeChunk",
        ):
            self.assertIn(key, detail)

    def test_bitmap_is_base64_of_the_right_length(self):
        self.patch_wdb()
        wall = self.make_wall(21223)
        payload = self.game.bitmap(wall)
        self.assertEqual(len(base64.b64decode(payload["solvedBitmap"])), 2653)


class LeaderboardTest(InfiniteWallTestBase):
    """
    Built straight off finished walls -- no separate leaderboard model. Their
    elapsed_ms is frozen at completion, so nothing here needs stale-clock
    reaping the way a running wall does.
    """

    def finish(self, user, lexicon, word_length, elapsed_ms, days_ago=0):
        wall = InfiniteWall.objects.create(
            user=user,
            lexicon=lexicon,
            word_length=word_length,
            num_alphagrams=24,
            chunk_w=DEFAULT_CHUNK_W,
            chunk_h=DEFAULT_CHUNK_H,
            chunk_cols=1,
            seed=1,
            state=InfiniteWall.DONE,
            solved_count=24,
            elapsed_ms=elapsed_ms,
            completed=timezone.now() - timedelta(days=days_ago),
        )
        return wall

    def test_empty_when_nobody_has_finished(self):
        self.assertEqual(leaderboards(), [])

    def test_unfinished_walls_never_appear(self):
        # A running wall's clock is still moving; only completed runs count.
        self.make_wall(24)
        self.make_wall(24, state=InfiniteWall.PAUSED)
        self.assertEqual(leaderboards(), [])

    def test_one_board_per_lexicon_and_length(self):
        csw = Lexicon.objects.get(lexiconName="CSW24")
        self.finish(self.user, self.lexicon, 7, 1000)
        self.finish(self.user, self.lexicon, 8, 1000)
        self.finish(self.user, csw, 7, 1000)

        boards = leaderboards()
        self.assertEqual(
            [(b["lexicon"], b["word_length"]) for b in boards],
            [("CSW24", 7), ("NWL23", 7), ("NWL23", 8)],
        )

    def test_fastest_first_and_ranked(self):
        self.finish(self.user, self.lexicon, 7, 30000)
        self.finish(self.other_user, self.lexicon, 7, 10000)

        entries = leaderboards()[0]["entries"]
        self.assertEqual([e["username"] for e in entries],
                         [self.other_user.username, self.user.username])
        self.assertEqual([e["rank"] for e in entries], [1, 2])
        self.assertEqual([e["elapsed_ms"] for e in entries], [10000, 30000])

    def test_a_player_appears_once_with_their_best_time(self):
        self.finish(self.user, self.lexicon, 7, 50000, days_ago=2)
        self.finish(self.user, self.lexicon, 7, 20000, days_ago=1)
        self.finish(self.other_user, self.lexicon, 7, 35000)

        entries = leaderboards()[0]["entries"]
        self.assertEqual(len(entries), 2)
        me = next(e for e in entries if e["username"] == self.user.username)
        self.assertEqual(me["elapsed_ms"], 20000)
        self.assertEqual(me["rank"], 1)

    def test_respects_the_size_limit(self):
        for i in range(5):
            user = User.objects.create_user(f"runner{i}", f"r{i}@x.com", "pw")
            self.finish(user, self.lexicon, 7, 1000 * (i + 1))

        entries = leaderboards(limit=3)[0]["entries"]
        self.assertEqual(len(entries), 3)
        self.assertEqual([e["elapsed_ms"] for e in entries], [1000, 2000, 3000])

    def test_a_slow_run_does_not_use_up_a_slot_before_a_fast_one(self):
        # The limit is applied after ordering, not while scanning arbitrary rows.
        for i in range(4):
            user = User.objects.create_user(f"slow{i}", f"s{i}@x.com", "pw")
            self.finish(user, self.lexicon, 7, 900000 - i)
        fast = User.objects.create_user("fast", "f@x.com", "pw")
        self.finish(fast, self.lexicon, 7, 1)

        entries = leaderboards(limit=2)[0]["entries"]
        self.assertEqual(entries[0]["username"], "fast")

    def test_carries_the_wall_size_for_context(self):
        self.finish(self.user, self.lexicon, 7, 1000)
        self.assertEqual(leaderboards()[0]["num_alphagrams"], 24)


class InfiniteWallViewTest(InfiniteWallTestBase):
    """The pages render at all -- neither view had coverage before."""

    def test_picker_requires_login(self):
        response = self.client.get(reverse("infinite_picker"))
        self.assertEqual(response.status_code, 302)

    def test_picker_renders_with_no_walls(self):
        self.client.force_login(self.user)
        response = self.client.get(reverse("infinite_picker"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Build the wall")
        self.assertContains(response, "Nobody has cleared a wall yet")

    def test_picker_lists_your_walls_and_the_leaderboard(self):
        self.make_wall(24, state=InfiniteWall.PAUSED)
        InfiniteWall.objects.create(
            user=self.other_user,
            lexicon=self.lexicon,
            word_length=7,
            num_alphagrams=24,
            chunk_w=DEFAULT_CHUNK_W,
            chunk_h=DEFAULT_CHUNK_H,
            chunk_cols=1,
            seed=1,
            state=InfiniteWall.DONE,
            solved_count=24,
            elapsed_ms=1234567,
            completed=timezone.now(),
        )
        self.client.force_login(self.user)
        response = self.client.get(reverse("infinite_picker"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Hall of Fame")
        # Another player's finished run shows on the board...
        self.assertContains(response, self.other_user.username)
        # ...and the raw ms is emitted for the page script to format.
        self.assertContains(response, "1234567")

    def test_wall_page_renders_for_its_owner(self):
        wall = self.make_wall(24)
        self.client.force_login(self.user)
        response = self.client.get(reverse("infinite_wall", args=(wall.pk,)))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "InfiniteGlobals")

    def test_wall_page_turns_away_someone_elses_wall(self):
        wall = self.make_wall(24)
        self.client.force_login(self.other_user)
        response = self.client.get(reverse("infinite_wall", args=(wall.pk,)))
        self.assertRedirects(response, reverse("infinite_picker"))

    def test_pages_survive_a_user_with_no_profile(self):
        # The profile only supplies a default lexicon and a tile style; missing
        # one used to 500 the whole page.
        self.assertFalse(hasattr(self.other_user, "aerolithprofile"))
        wall = InfiniteWall.objects.create(
            user=self.other_user,
            lexicon=self.lexicon,
            word_length=7,
            num_alphagrams=24,
            chunk_w=DEFAULT_CHUNK_W,
            chunk_h=DEFAULT_CHUNK_H,
            chunk_cols=1,
            seed=1,
        )
        self.client.force_login(self.other_user)
        self.assertEqual(
            self.client.get(reverse("infinite_picker")).status_code, 200
        )
        self.assertEqual(
            self.client.get(reverse("infinite_wall", args=(wall.pk,))).status_code,
            200,
        )


class ProgressMaskTest(SimpleTestCase):
    def test_padded_zero_extends_without_touching_the_original(self):
        original = b"\x05"
        out = padded(original, 20)
        self.assertEqual(bytes(out), b"\x05\x00\x00")
        self.assertEqual(original, b"\x05")
        # Never truncates.
        self.assertEqual(bytes(padded(b"\x01\x02", 3)), b"\x01\x02")

    def test_popcount(self):
        self.assertEqual(popcount(b""), 0)
        self.assertEqual(popcount(b"\xff\x01"), 9)

    def test_word_bits_number_words_in_answers_order(self):
        answers = [
            {"g": 4, "q": "NRU", "a": ["RUN", "URN"]},
            {"g": 9, "q": "AET", "a": ["ATE", "EAT", "TEA"]},
        ]
        bits = word_bits(answers)
        self.assertEqual(
            {word: bit for word, (bit, _entry) in bits.items()},
            {"RUN": 0, "URN": 1, "ATE": 2, "EAT": 3, "TEA": 4},
        )
        self.assertIs(bits["TEA"][1], answers[1])

    def masks_for(self, n, chunk_size, solved):
        """Per-rectangle masks for a set of solved cells."""
        masks = {}
        for g in solved:
            chunk, local = divmod(g, chunk_size)
            mask = masks.setdefault(chunk, bytearray(bitmap_size(chunk_size)))
            set_bit(mask, local)
        return [(chunk, bytes(mask)) for chunk, mask in masks.items()]

    def assert_assembles(self, n, chunk_size, solved):
        bitmap = assemble_bitmap(n, chunk_size, self.masks_for(n, chunk_size, solved))
        self.assertEqual(len(bitmap), bitmap_size(n))
        self.assertEqual(
            {g for g in range(n) if get_bit(bitmap, g)}, set(solved)
        )

    def test_assembles_aligned_rectangles(self):
        self.assert_assembles(300, 128, {0, 7, 8, 127, 128, 200, 299})

    def test_assembles_an_older_unaligned_shape(self):
        # 5x20 = 100 cells, which does not land on byte boundaries.
        self.assert_assembles(21223, 100, {0, 99, 100, 101, 12900, 21222})

    def test_empty_wall_progress(self):
        self.assertEqual(assemble_bitmap(24, 128, []), bytes(3))


class InfiniteWallProgressStorageTest(InfiniteWallTestBase):
    """Progress lives on the rectangles; the wall row only keeps a count."""

    def setUp(self):
        super().setUp()
        self.patch_wdb()

    def first_entry(self, wall, chunk_index=0):
        chunk = InfiniteWallChunk.objects.get(wall=wall, chunk_index=chunk_index)
        return chunk.answers[0]

    def test_revisit_reports_found_words(self):
        """
        The bug this guards: words found on an earlier visit were left out of
        the rectangle payload, so the client called a retype of one wrong
        instead of already solved.
        """
        wall = self.make_wall(300)
        self.game.load_chunk(wall, 0)
        entry = self.first_entry(wall)
        self.game.guess(wall, 0, entry["a"][0])
        self.game.load_chunk(wall, 1)

        payload = self.game.load_chunk(wall, 0)
        self.assertEqual(payload["solvedWords"], [entry["a"][0]])
        self.assertEqual(payload["solvedCells"], [])

    def test_first_visit_reports_nothing_solved(self):
        wall = self.make_wall(200)
        payload = self.game.load_chunk(wall, 0)
        self.assertEqual(payload["solvedWords"], [])
        self.assertEqual(payload["solvedCells"], [])

    def test_solved_cells_lists_finished_alphagrams(self):
        wall = self.make_wall(300)
        self.game.load_chunk(wall, 1)
        entry = self.first_entry(wall, 1)
        for word in entry["a"]:
            self.game.guess(wall, 1, word)
        payload = self.game.load_chunk(wall, 1)
        self.assertEqual(payload["solvedCells"], [entry["g"]])

    def test_a_guess_writes_only_the_small_columns(self):
        wall = self.make_wall(200)
        self.game.load_chunk(wall, 0)
        entry = self.first_entry(wall)

        with CaptureQueriesContext(connection) as ctx:
            for word in entry["a"]:
                self.game.guess(wall, 0, word)
        updates = [
            q["sql"] for q in ctx.captured_queries if q["sql"].startswith("UPDATE")
        ]
        self.assertTrue(updates)
        for sql in updates:
            self.assertNotIn('"answers"', sql)
            self.assertNotIn('"solved_bitmap"', sql)
            self.assertNotIn('"solved_words"', sql)

    def test_clearing_a_rectangle_drops_its_answers_but_keeps_its_cells(self):
        wall = self.make_wall(300)
        self.game.load_chunk(wall, 1)
        self.solve_chunk(wall, 1)

        chunk = InfiniteWallChunk.objects.get(wall=wall, chunk_index=1)
        self.assertEqual(chunk.answers, [])
        self.assertEqual(popcount(chunk.solved_cells), DEFAULT_CHUNK_SIZE)
        wall.refresh_from_db()
        self.assertEqual(wall.solved_count, DEFAULT_CHUNK_SIZE)
        for g in range(DEFAULT_CHUNK_SIZE, 2 * DEFAULT_CHUNK_SIZE):
            self.assertTrue(self.cell_solved(wall, g))
        self.assertFalse(self.cell_solved(wall, 0))

    def test_a_cleared_rectangle_reloads_empty(self):
        wall = self.make_wall(300)
        self.game.load_chunk(wall, 0)
        self.solve_chunk(wall, 0)
        payload = self.game.load_chunk(wall, 0)
        self.assertEqual(payload["questions"], [])
        self.assertEqual(len(payload["solvedCells"]), DEFAULT_CHUNK_SIZE)

    def test_answerless_cells_show_as_solved(self):
        mock.patch.stopall()
        mock.patch(
            "wordwalls.infinite_game.questions_from_probability_list",
            side_effect=lambda lex, probs, wl, expand=False: fake_wdb_response(
                sorted(probs)[:-3]
            ),
        ).start()
        wall = self.make_wall(100)
        payload = self.game.load_chunk(wall, 0)
        self.assertEqual(len(payload["solvedCells"]), 3)
        for g in payload["solvedCells"]:
            self.assertTrue(self.cell_solved(wall, g))

    def test_guessing_into_a_row_with_empty_masks_works(self):
        # A rectangle row the pre-0019 code created mid-deploy has b"" masks.
        wall = self.make_wall(200)
        self.game.load_chunk(wall, 0)
        InfiniteWallChunk.objects.filter(wall=wall).update(
            solved_cells=b"", solved_word_bits=b""
        )
        entry = self.first_entry(wall)
        for word in entry["a"]:
            result = self.game.guess(wall, 0, word)
        self.assertTrue(result["alphagramSolved"])
        self.assertTrue(self.cell_solved(wall, entry["g"]))
        self.assertEqual(self.game.load_chunk(wall, 0)["solvedWords"], sorted(entry["a"]))


class LegacyProgressMergeTest(InfiniteWallTestBase):
    """Migration 0019's merge of the old wall bitmap and word lists."""

    merge = staticmethod(
        importlib.import_module(
            "wordwalls.migrations.0019_infinitewallchunk_progress_masks"
        ).merge_legacy_progress
    )

    def legacy_chunk(self, wall, chunk_index, solved_cells, solved_words):
        """A rectangle as the old code left it: progress only in legacy fields."""
        size = DEFAULT_CHUNK_SIZE
        base = chunk_index * size
        cells = range(base, min(base + size, wall.num_alphagrams))
        answers = [
            {"g": g, "q": "Q{0}".format(g), "a": ["A{0}".format(g), "B{0}".format(g)]}
            for g in cells
        ]
        bitmap = bytearray(wall.solved_bitmap or bitmap_size(wall.num_alphagrams))
        for g in solved_cells:
            set_bit(bitmap, g)
        wall.solved_bitmap = bytes(bitmap)
        wall.solved_count += len(solved_cells)
        wall.save()
        return InfiniteWallChunk.objects.create(
            wall=wall,
            chunk_index=chunk_index,
            answers=answers,
            solved_words=solved_words,
        )

    def run_merge(self):
        self.merge(apps, None)

    def test_moves_cells_and_words_onto_the_rectangle(self):
        wall = self.make_wall(300)
        self.legacy_chunk(wall, 1, {130}, ["A130", "B130", "A131"])

        self.run_merge()
        chunk = InfiniteWallChunk.objects.get(wall=wall, chunk_index=1)
        self.assertTrue(get_bit(bytes(chunk.solved_cells), 130 - 128))
        self.assertEqual(popcount(chunk.solved_cells), 1)

        self.patch_wdb()
        payload = self.game.load_chunk(wall, 1)
        self.assertEqual(payload["solvedWords"], ["A130", "A131", "B130"])
        self.assertEqual(payload["solvedCells"], [130])
        self.assertTrue(self.cell_solved(wall, 130))
        self.assertFalse(self.cell_solved(wall, 131))

    def test_is_idempotent_and_keeps_newer_progress(self):
        wall = self.make_wall(300)
        self.legacy_chunk(wall, 0, {5}, ["A5", "B5"])
        self.run_merge()

        # New code records more progress, then the merge runs again (0020).
        chunk = InfiniteWallChunk.objects.get(wall=wall, chunk_index=0)
        cells = padded(chunk.solved_cells, DEFAULT_CHUNK_SIZE)
        set_bit(cells, 6)
        chunk.solved_cells = bytes(cells)
        chunk.save()
        self.run_merge()

        chunk.refresh_from_db()
        self.assertEqual(popcount(chunk.solved_cells), 2)
        wall.refresh_from_db()
        self.assertEqual(wall.solved_count, 2)

    def test_prunes_already_cleared_rectangles(self):
        wall = self.make_wall(150)
        self.legacy_chunk(wall, 1, set(range(128, 150)), [])
        self.run_merge()
        chunk = InfiniteWallChunk.objects.get(wall=wall, chunk_index=1)
        self.assertEqual(chunk.answers, [])
        self.assertEqual(popcount(chunk.solved_cells), 22)

    def test_corrects_a_drifted_count(self):
        wall = self.make_wall(300)
        self.legacy_chunk(wall, 0, {1, 2}, [])
        InfiniteWall.objects.filter(pk=wall.pk).update(solved_count=7)
        self.run_merge()
        wall.refresh_from_db()
        self.assertEqual(wall.solved_count, 2)

    def test_leaves_a_finished_walls_count_alone(self):
        # Seeded or hand-made finished walls can have no rectangles at all;
        # recounting from bits would zero out a leaderboard entry.
        wall = self.make_wall(24, state=InfiniteWall.DONE)
        InfiniteWall.objects.filter(pk=wall.pk).update(solved_count=24)
        self.run_merge()
        wall.refresh_from_db()
        self.assertEqual(wall.solved_count, 24)
        self.assertEqual(wall.state, InfiniteWall.DONE)

    def test_unaligned_older_shape(self):
        wall = self.make_wall(300)
        wall.chunk_w, wall.chunk_h = 5, 20
        wall.save()
        size = 100
        bitmap = bytearray(bitmap_size(300))
        set_bit(bitmap, 205)
        wall.solved_bitmap = bytes(bitmap)
        wall.solved_count = 1
        wall.save()
        InfiniteWallChunk.objects.create(
            wall=wall,
            chunk_index=2,
            answers=[{"g": g, "q": "Q", "a": ["W{0}".format(g)]} for g in range(200, 300)],
        )
        self.run_merge()
        chunk = InfiniteWallChunk.objects.get(wall=wall, chunk_index=2)
        self.assertTrue(get_bit(bytes(chunk.solved_cells), 205 - 2 * size))
        self.assertTrue(self.cell_solved(wall, 205))
