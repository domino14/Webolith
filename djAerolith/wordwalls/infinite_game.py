"""
Game logic for the Great Wall.

Shaped like wordwalls.game.WordwallsGame -- a stateless service object whose
methods each take a lock on the row they mutate -- but with a very different state
model. There is no question cursor and no materialized list: the alphagram in a
cell is derived from (seed, cell) on demand, and progress is a small bitmask on
each visited rectangle's row.
"""

import base64
import json
import logging
import random
from contextlib import contextmanager
from math import ceil

from django.db import transaction
from django.db.models import Count, Max
from django.utils import timezone

from lib.wdb_interface.wdb_helper import (
    questions_from_alpha_dicts,
    questions_from_probability_list,
)
from wordwalls.infinite_models import InfiniteWall, InfiniteWallChunk
from wordwalls.infinite_perm import (
    DEFAULT_CHUNK_H,
    DEFAULT_CHUNK_SIZE,
    DEFAULT_CHUNK_W,
    VALID_WORD_LENGTHS,
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

# A running wall pings this often from the browser. Only ever written at
# navigation points and on the ping -- never on the guess path, so the write
# stays HOT.
HEARTBEAT_SECONDS = 30
# How long a running wall may go unheard from before we consider its tab gone.
# Generous enough to survive a slow request or a briefly backgrounded tab.
STALE_AFTER_SECONDS = 90


class InfiniteWallError(Exception):
    """Anything the player is allowed to see the message for."""


class InfiniteWallGame:
    # -- creation ------------------------------------------------------------

    def create(self, user, lexicon, word_length: int) -> InfiniteWall:
        if word_length not in VALID_WORD_LENGTHS:
            raise InfiniteWallError(
                "Word length must be one of {0}.".format(
                    ", ".join(str(w) for w in VALID_WORD_LENGTHS)
                )
            )
        try:
            length_counts = json.loads(lexicon.lengthCounts)
        except (TypeError, ValueError):
            raise InfiniteWallError(
                "Lexicon {0} has no alphagram counts.".format(lexicon.lexiconName)
            )
        n = length_counts.get(str(word_length))
        if not n:
            raise InfiniteWallError(
                "{0} has no {1}-letter alphagrams.".format(
                    lexicon.lexiconName, word_length
                )
            )

        # Freeze the rectangle shape onto the wall; see InfiniteWall.chunk_w.
        wall = InfiniteWall.objects.create(
            user=user,
            lexicon=lexicon,
            word_length=word_length,
            num_alphagrams=n,
            chunk_w=DEFAULT_CHUNK_W,
            chunk_h=DEFAULT_CHUNK_H,
            chunk_cols=chunk_cols_for(
                ceil(n / DEFAULT_CHUNK_SIZE), DEFAULT_CHUNK_W, DEFAULT_CHUNK_H
            ),
            # Positive so it always round-trips through a signed BIGINT.
            seed=random.SystemRandom().getrandbits(62),
        )
        logger.info(
            "event=infinite_wall_created wall=%s user=%s lexicon=%s length=%s n=%s",
            wall.pk,
            user.username,
            lexicon.lexiconName,
            word_length,
            n,
        )
        return wall

    # -- fetching / access control -------------------------------------------

    def get_wall(self, wall_id, user, lock: bool = False) -> InfiniteWall:
        qs = InfiniteWall.objects.select_related("lexicon")
        if lock:
            # of=self so we don't also lock the joined lexicon row.
            qs = qs.select_for_update(of=("self",))
        try:
            wall = qs.get(pk=wall_id)
        except (InfiniteWall.DoesNotExist, ValueError):
            raise InfiniteWallError("That wall does not exist.")
        if wall.user_id != user.pk:
            raise InfiniteWallError("That wall belongs to someone else.")
        return wall

    def geometry(self, wall: InfiniteWall) -> WallGeometry:
        # Always the wall's own frozen shape, never the current defaults.
        return WallGeometry(
            wall.num_alphagrams, wall.chunk_cols, wall.chunk_w, wall.chunk_h
        )

    def permutation(self, wall: InfiniteWall) -> WallPermutation:
        return WallPermutation(wall.seed, wall.num_alphagrams)

    # -- the clock -----------------------------------------------------------

    def elapsed_ms(self, wall: InfiniteWall) -> int:
        """
        True elapsed run time, derived rather than stored.

        Because a running wall keeps `resumed_at`, this stays correct even if the
        player closes the tab -- which is the honest outcome for a timed run.
        """
        if wall.state == InfiniteWall.RUNNING and wall.resumed_at:
            delta = (timezone.now() - wall.resumed_at).total_seconds() * 1000
            return int(wall.elapsed_ms + max(0.0, delta))
        return int(wall.elapsed_ms)

    def resume(self, wall: InfiniteWall) -> dict:
        if wall.state == InfiniteWall.DONE:
            raise InfiniteWallError("This wall is already finished.")
        if wall.state != InfiniteWall.RUNNING:
            wall.state = InfiniteWall.RUNNING
            wall.resumed_at = timezone.now()
            wall.save(update_fields=["state", "resumed_at", "last_activity"])
        return self.wall_status(wall)

    def heartbeat(self, wall: InfiniteWall) -> dict:
        """
        Say the tab is still open.

        last_activity is not indexed, so this stays a HOT update; it is the only
        way to tell a wall genuinely running in another tab from one whose
        browser went away.
        """
        if wall.state == InfiniteWall.RUNNING:
            wall.save(update_fields=["last_activity"])
        return self.wall_status(wall)

    def reap_if_stale(self, wall: InfiniteWall) -> bool:
        """
        Pause a running wall whose browser has stopped checking in.

        Elapsed time is credited only up to the last heartbeat, not up to now --
        shutting a laptop mid-run should cost the heartbeat interval, not the
        hours until you next look at the wall. Returns whether it reaped.
        """
        if wall.state != InfiniteWall.RUNNING or not wall.resumed_at:
            return False
        silent_for = (timezone.now() - wall.last_activity).total_seconds()
        if silent_for <= STALE_AFTER_SECONDS:
            return False

        # last_activity can predate resumed_at if the wall was resumed and then
        # immediately abandoned; never credit negative time.
        live_ms = max(
            0.0, (wall.last_activity - wall.resumed_at).total_seconds() * 1000
        )
        wall.elapsed_ms = int(wall.elapsed_ms + live_ms)
        wall.resumed_at = None
        wall.state = InfiniteWall.PAUSED
        wall.active_chunk = None
        wall.save(
            update_fields=["elapsed_ms", "resumed_at", "state", "active_chunk"]
        )
        logger.info(
            "event=infinite_wall_reaped wall=%s silent_for=%.0fs elapsed_ms=%s",
            wall.pk,
            silent_for,
            wall.elapsed_ms,
        )
        return True

    def pause(self, wall: InfiniteWall) -> dict:
        if wall.state == InfiniteWall.RUNNING:
            wall.elapsed_ms = self.elapsed_ms(wall)
            wall.resumed_at = None
            wall.state = InfiniteWall.PAUSED
            # Drop the active rectangle so a paused wall cannot be guessed into
            # from a client that still has the questions cached.
            wall.active_chunk = None
            wall.save(
                update_fields=[
                    "elapsed_ms",
                    "resumed_at",
                    "state",
                    "active_chunk",
                    "last_activity",
                ]
            )
        return self.wall_status(wall)

    # -- payloads ------------------------------------------------------------

    def wall_status(self, wall: InfiniteWall) -> dict:
        return {
            "state": wall.state,
            "elapsedMs": self.elapsed_ms(wall),
            "solvedCount": wall.solved_count,
            "activeChunk": wall.active_chunk,
        }

    def wall_detail(self, wall: InfiniteWall) -> dict:
        detail = {
            "wallId": wall.pk,
            "lexicon": wall.lexicon.lexiconName,
            "wordLength": wall.word_length,
        }
        detail.update(self.geometry(wall).to_dict())
        detail.update(self.bitmap(wall))
        return detail

    def bitmap(self, wall: InfiniteWall) -> dict:
        """
        The wall-wide bitmap, assembled from the rectangles' own masks.

        values_list reads just the two small columns, so the out-of-line answers
        are never fetched. A wall has at most n / chunk_size rectangle rows.
        """
        masks = InfiniteWallChunk.objects.filter(wall=wall).values_list(
            "chunk_index", "solved_cells"
        )
        geometry = self.geometry(wall)
        bitmap = assemble_bitmap(geometry.n, geometry.chunk_size, masks)
        payload = {"solvedBitmap": base64.b64encode(bitmap).decode()}
        payload.update(self.wall_status(wall))
        return payload

    # -- rectangles ----------------------------------------------------------

    def load_chunk(self, wall: InfiniteWall, chunk_index) -> dict:
        """
        Hydrate one rectangle and make it the active one.

        Costs exactly one word-server round trip: a probability-list search on
        first visit, an Expand on revisits.
        """
        geometry = self.geometry(wall)
        if not geometry.valid_chunk(chunk_index):
            raise InfiniteWallError("No such rectangle on this wall.")
        if wall.state != InfiniteWall.RUNNING:
            raise InfiniteWallError("Resume the wall before opening a rectangle.")

        chunk = InfiniteWallChunk.objects.filter(
            wall=wall, chunk_index=chunk_index
        ).first()
        if chunk is None:
            # The search already returns fully hydrated questions, so hand them
            # straight to the packet builder instead of paying for an Expand.
            chunk, hydrated = self._materialize_chunk(wall, geometry, chunk_index)
        else:
            hydrated = None

        if wall.state == InfiniteWall.RUNNING and wall.active_chunk != chunk_index:
            wall.active_chunk = chunk_index
            wall.save(update_fields=["active_chunk", "last_activity"])

        solved = self._solved_words(chunk)
        base = chunk_index * geometry.chunk_size
        cell_mask = padded(chunk.solved_cells, geometry.chunk_size)
        payload = {
            "chunk": chunk_index,
            "questions": self._question_packets(wall, chunk, solved, hydrated),
            # Words already found here, so a revisit can tell a repeat from a
            # wrong guess without a round trip -- they are not in `questions`.
            "solvedWords": sorted(solved),
            # Lets the client light up cells the server credited on its own
            # (answerless ones) without refetching the whole bitmap.
            "solvedCells": [
                g
                for g in geometry.cells_in_chunk(chunk_index)
                if get_bit(cell_mask, g - base)
            ],
        }
        payload.update(self.wall_status(wall))
        return payload

    def _materialize_chunk(
        self, wall: InfiniteWall, geometry: WallGeometry, chunk_index: int
    ):
        cells = geometry.cells_in_chunk(chunk_index)
        probabilities, prob_to_cell = self.permutation(wall).probabilities_for_cells(
            cells
        )
        questions = questions_from_probability_list(
            wall.lexicon, probabilities, wall.word_length, expand=True
        )

        # The word server answers `ORDER BY alphagrams.probability` no matter what
        # order we asked in, so map each result back to its cell and sort.
        answers = []
        for question in questions.questions_array():
            if not question.answers:
                continue
            cell = prob_to_cell.get(question.alphagram.probability)
            if cell is None:
                logger.warning(
                    "event=infinite_wall_unexpected_alphagram wall=%s chunk=%s "
                    "alphagram=%s probability=%s",
                    wall.pk,
                    chunk_index,
                    question.alphagram.alphagram,
                    question.alphagram.probability,
                )
                continue
            answers.append(
                {
                    "g": cell,
                    "q": question.alphagram.alphagram,
                    "a": [w.word for w in question.answers],
                }
            )
        answers.sort(key=lambda entry: entry["g"])

        # A cell the lexicon has no answers for can never be solved, so credit it
        # now rather than leaving the wall permanently uncompletable.
        base = chunk_index * geometry.chunk_size
        solved_cells = bytearray(bitmap_size(geometry.chunk_size))
        missing = set(cells) - {entry["g"] for entry in answers}
        for g in missing:
            set_bit(solved_cells, g - base)

        chunk = InfiniteWallChunk.objects.create(
            wall=wall,
            chunk_index=chunk_index,
            answers=answers,
            solved_cells=bytes(solved_cells),
            solved_word_bits=bytes(bitmap_size(len(word_bits(answers)))),
        )

        if missing:
            logger.warning(
                "event=infinite_wall_empty_cells wall=%s chunk=%s count=%s",
                wall.pk,
                chunk_index,
                len(missing),
            )
            self._credit(wall, len(missing))
            self._prune_if_cleared(chunk, geometry)

        return chunk, questions

    def _solved_words(self, chunk: InfiniteWallChunk) -> set:
        answers = word_bits(chunk.answers)
        bits = padded(chunk.solved_word_bits, len(answers))
        return {word for word, (bit, _entry) in answers.items() if get_bit(bits, bit)}

    def _question_packets(
        self, wall: InfiniteWall, chunk: InfiniteWallChunk, solved, hydrated=None
    ):
        """
        Build the front-end packet for a rectangle.

        Only unsolved words are sent, and fully solved alphagrams are omitted
        entirely. That makes the remaining-answers chip correct for free on a
        partially solved alphagram, and means a resumed rectangle never ships
        back answers the player already found.
        """
        pending = [
            entry for entry in chunk.answers if not solved.issuperset(entry["a"])
        ]
        if not pending:
            return []

        if hydrated is None:
            hydrated = questions_from_alpha_dicts(
                wall.lexicon, [{"q": entry["q"], "a": entry["a"]} for entry in pending]
            )
        cell_by_alphagram = {entry["q"]: entry["g"] for entry in pending}

        packets = []
        for question in hydrated.questions_array():
            cell = cell_by_alphagram.get(question.alphagram.alphagram)
            if cell is None:
                continue
            words = [
                {
                    "w": w.word,
                    "d": w.definition,
                    "fh": w.front_hooks,
                    "bh": w.back_hooks,
                    "s": w.lexicon_symbols,
                    "ifh": w.inner_front_hook,
                    "ibh": w.inner_back_hook,
                }
                for w in question.answers
                if w.word not in solved
            ]
            if not words:
                continue
            packets.append(
                {"a": question.alphagram.alphagram, "ws": words, "g": cell}
            )
        packets.sort(key=lambda packet: packet["g"])
        return packets

    # -- guessing ------------------------------------------------------------

    def guess(self, wall: InfiniteWall, chunk_index, guess_str: str) -> dict:
        guess_str = (guess_str or "").strip().upper()
        if wall.state != InfiniteWall.RUNNING:
            raise InfiniteWallError("This wall is not running.")
        if chunk_index != wall.active_chunk:
            raise InfiniteWallError("That rectangle is not open.")

        chunk = InfiniteWallChunk.objects.filter(
            wall=wall, chunk_index=chunk_index
        ).first()
        if chunk is None:
            raise InfiniteWallError("That rectangle is not loaded.")

        geometry = self.geometry(wall)
        base = chunk_index * geometry.chunk_size
        bits = word_bits(chunk.answers)
        found = bits.get(guess_str)
        if found is None:
            payload = {"alphagram": None, "word": None, "alreadySolved": False}
            payload.update(self.wall_status(wall))
            return payload

        bit, entry = found
        # Padded because a row the pre-0019 code created mid-deploy has empty
        # masks; 0020 merges whatever that code recorded.
        word_mask = padded(chunk.solved_word_bits, len(bits))
        cell_mask = padded(chunk.solved_cells, geometry.chunk_size)
        if get_bit(word_mask, bit):
            payload = {
                "alphagram": entry["q"],
                "word": guess_str,
                "cell": entry["g"],
                "alreadySolved": True,
                "alphagramSolved": get_bit(cell_mask, entry["g"] - base),
            }
            payload.update(self.wall_status(wall))
            return payload

        set_bit(word_mask, bit)
        chunk.solved_word_bits = bytes(word_mask)
        fields = ["solved_word_bits"]

        alphagram_done = all(get_bit(word_mask, bits[w][0]) for w in entry["a"])
        if alphagram_done:
            set_bit(cell_mask, entry["g"] - base)
            chunk.solved_cells = bytes(cell_mask)
            fields.append("solved_cells")
        # Only these small columns are written; answers is stored out of line
        # (migration 0019), so it is not copied by this update.
        chunk.save(update_fields=fields)

        if alphagram_done:
            self._credit(wall, 1)
            self._prune_if_cleared(chunk, geometry)

        payload = {
            "alphagram": entry["q"],
            "word": guess_str,
            "cell": entry["g"],
            "alreadySolved": False,
            "alphagramSolved": alphagram_done,
        }
        payload.update(self.wall_status(wall))
        payload["completed"] = wall.state == InfiniteWall.DONE
        return payload

    def _prune_if_cleared(
        self, chunk: InfiniteWallChunk, geometry: WallGeometry
    ) -> None:
        """
        Drop a cleared rectangle's answers.

        Nothing is left to guess, and they are derivable from (seed, cell)
        anyway; this is what keeps a finished wall to a few bytes per rectangle
        instead of the whole lexicon. solved_cells stays, since the overview is
        drawn from it.
        """
        if popcount(chunk.solved_cells) < len(
            geometry.cells_in_chunk(chunk.chunk_index)
        ):
            return
        chunk.answers = []
        chunk.solved_word_bits = b""
        chunk.save(update_fields=["answers", "solved_word_bits"])

    def _credit(self, wall: InfiniteWall, newly: int) -> None:
        """Count newly solved cells, and finish the wall if they were the last."""
        wall.solved_count += newly
        # last_activity is deliberately absent: this runs on every solved
        # alphagram (~21k times over a full sevens run), and auto_now would make
        # each one a wider write for no benefit. Navigation points refresh it.
        fields = ["solved_count"]

        if wall.solved_count >= wall.num_alphagrams:
            wall.elapsed_ms = self.elapsed_ms(wall)
            wall.resumed_at = None
            wall.state = InfiniteWall.DONE
            wall.active_chunk = None
            wall.completed = timezone.now()
            # Happens once per wall, so the wider write is free here.
            fields += [
                "elapsed_ms",
                "resumed_at",
                "state",
                "active_chunk",
                "completed",
                "last_activity",
            ]
            logger.info(
                "event=infinite_wall_completed wall=%s user=%s elapsed_ms=%s",
                wall.pk,
                wall.user_id,
                wall.elapsed_ms,
            )
        wall.save(update_fields=fields)


LEADERBOARD_SIZE = 10


def finishers(lexicon_id, word_length):
    """
    Every player who has cleared this wall type, fastest first.

    One row per player -- their best run, the earliest one on a tie -- picked in
    the database with DISTINCT ON, so a board pages cleanly however many
    players it holds.

    Reads only finished walls. Their elapsed_ms was frozen at completion and
    resumed_at cleared, so -- unlike a wall still in progress -- there is no
    stale clock to reap here and the stored number can be trusted as-is.
    """
    done = InfiniteWall.objects.filter(
        state=InfiniteWall.DONE,
        completed__isnull=False,
        lexicon_id=lexicon_id,
        word_length=word_length,
    )
    best = (
        done.order_by("user_id", "elapsed_ms", "completed", "pk")
        .distinct("user_id")
        .values("pk")
    )
    return (
        InfiniteWall.objects.filter(pk__in=best)
        .select_related("user")
        .order_by("elapsed_ms", "completed", "pk")
    )


def ranked_entries(walls, first_rank=1):
    """Leaderboard rows for a slice of finishers(); ranks follow the slice."""
    return [
        {
            "rank": first_rank + i,
            "username": wall.user.username,
            "elapsed_ms": wall.elapsed_ms,
            "completed": wall.completed,
        }
        for i, wall in enumerate(walls)
    ]


def leaderboards(limit: int = LEADERBOARD_SIZE):
    """
    One summary board per (lexicon, word length) that anyone has cleared.

    Each carries its top `limit` players and the total player count, so the
    picker can link to the full, paginated board when there are more.
    """
    boards = (
        InfiniteWall.objects.filter(state=InfiniteWall.DONE, completed__isnull=False)
        .values("lexicon_id", "lexicon__lexiconName", "word_length")
        .annotate(
            players=Count("user_id", distinct=True),
            num_alphagrams=Max("num_alphagrams"),
        )
        .order_by("lexicon__lexiconName", "word_length")
    )
    return [
        {
            "lexicon_id": board["lexicon_id"],
            "lexicon": board["lexicon__lexiconName"],
            "word_length": board["word_length"],
            "num_alphagrams": board["num_alphagrams"],
            "players": board["players"],
            "entries": ranked_entries(
                finishers(board["lexicon_id"], board["word_length"])[:limit]
            ),
        }
        for board in boards
    ]


@contextmanager
def locked_wall(wall_id, user):
    """
    Yield a row-locked wall inside a transaction.

    Every mutating path goes through this, so the wall lock also serializes
    writes to its chunk rows.
    """
    with transaction.atomic():
        yield InfiniteWallGame().get_wall(wall_id, user, lock=True)
