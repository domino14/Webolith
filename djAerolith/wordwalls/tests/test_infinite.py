# -*- coding: utf-8 -*-
"""
Tests for the Great Wall.

The word server is mocked throughout, so these need no running word_db_server --
unlike test_game_logic.py, which talks to the real service.
"""

import logging
from datetime import timedelta
from math import ceil
from unittest import mock

from django.contrib.auth.models import User
from django.test import SimpleTestCase, TestCase
from django.utils import timezone

from base.models import Lexicon
from lib.domain import Alphagram, Question, Questions, Word
from wordwalls.infinite_game import InfiniteWallError, InfiniteWallGame
from wordwalls.infinite_models import InfiniteWall, InfiniteWallChunk
from wordwalls.infinite_perm import (
    DEFAULT_CHUNK_H,
    DEFAULT_CHUNK_SIZE,
    DEFAULT_CHUNK_W,
    WallGeometry,
    WallPermutation,
    bitmap_size,
    chunk_cols_for,
    get_bit,
    set_bit,
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
    def test_is_a_bijection(self):
        for n in (1, 2, 7, 100, 999, 1000, 2861, 21223):
            perm = WallPermutation(0xDEADBEEF, n)
            ranks = [perm.forward(cell) for cell in range(n)]
            self.assertEqual(
                set(ranks), set(range(n)), msg="not a bijection for n={0}".format(n)
            )

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
            solved_bitmap=bytes(bitmap_size(n)),
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
        self.assertEqual(len(bytes(wall.solved_bitmap)), 2653)

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
        self.assertFalse(get_bit(bytes(wall.solved_bitmap), entry["g"]))

    def test_full_alphagram_sets_the_bit(self):
        wall = self.make_wall(200)
        self.game.load_chunk(wall, 0)
        entry = self.first_entry(wall)

        for word in entry["a"]:
            result = self.game.guess(wall, 0, word)
        self.assertTrue(result["alphagramSolved"])
        wall.refresh_from_db()
        self.assertEqual(wall.solved_count, 1)
        self.assertTrue(get_bit(bytes(wall.solved_bitmap), entry["g"]))

    def test_repeat_guess_is_already_solved_and_does_not_double_count(self):
        wall = self.make_wall(200)
        self.game.load_chunk(wall, 0)
        entry = self.first_entry(wall)

        self.game.guess(wall, 0, entry["a"][0])
        result = self.game.guess(wall, 0, entry["a"][0])
        self.assertTrue(result["alreadySolved"])
        chunk = InfiniteWallChunk.objects.get(wall=wall, chunk_index=0)
        self.assertEqual(chunk.solved_words.count(entry["a"][0]), 1)

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
        self.assertTrue(get_bit(bytes(reloaded.solved_bitmap), entry["g"]))
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
        import base64

        self.patch_wdb()
        wall = self.make_wall(21223)
        payload = self.game.bitmap(wall)
        self.assertEqual(len(base64.b64decode(payload["solvedBitmap"])), 2653)
