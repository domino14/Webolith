"""
Models for the Great Wall.

Deliberately separate from the finite-list machinery in base.WordList: a wall has
no origQuestions blob, no questionIndex cursor, and no missed/firstMissed lists.
Progress lives on the rectangle rows as small per-rectangle bitmasks; the
alphagram that lives in a cell is derived on demand from (seed, cell) rather than
materialized.
"""

from django.contrib.auth.models import User
from django.db import models

from base.models import Lexicon


class InfiniteWall(models.Model):
    NOT_STARTED = "N"
    RUNNING = "R"
    PAUSED = "P"
    DONE = "D"
    STATES = (
        (NOT_STARTED, "Not started"),
        (RUNNING, "Running"),
        (PAUSED, "Paused"),
        (DONE, "Done"),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    lexicon = models.ForeignKey(Lexicon, on_delete=models.CASCADE)
    word_length = models.IntegerField()
    # Total alphagrams of this length in this lexicon; read from
    # Lexicon.lengthCounts at creation and frozen so the wall's coordinate space
    # can never shift under a player mid-run.
    num_alphagrams = models.IntegerField()
    # The wall's own rectangle shape, frozen at creation. These are stored rather
    # than read from infinite_perm's constants because chunk index -> cell range
    # is derived from them: retuning the defaults would otherwise re-point every
    # existing wall's solved bits and orphan its stored chunk rows.
    chunk_w = models.IntegerField(default=8)
    chunk_h = models.IntegerField(default=16)
    chunk_cols = models.IntegerField()
    seed = models.BigIntegerField()

    state = models.CharField(max_length=1, choices=STATES, default=NOT_STARTED)
    # Kept in step with the rectangles' solved_cells, so completion and the
    # picker's percentage never need to scan them.
    solved_count = models.IntegerField(default=0)

    # Accumulated running time, excluding any currently-running stretch.
    elapsed_ms = models.BigIntegerField(default=0)
    # Non-null exactly when state == RUNNING. Together with elapsed_ms this makes
    # the true elapsed time derivable server-side at any moment, so no heartbeat
    # is needed for the clock to stay honest.
    resumed_at = models.DateTimeField(null=True, blank=True)
    active_chunk = models.IntegerField(null=True, blank=True)

    created = models.DateTimeField(auto_now_add=True)
    # Only bumped at navigation points (pause/resume/open a rectangle), never on
    # the guess path. Keeping an indexed column out of the hot write path is what
    # lets a solve stay a HOT update -- see _credit_cells in infinite_game.py.
    last_activity = models.DateTimeField(auto_now=True)
    completed = models.DateTimeField(null=True, blank=True)

    # Deliberately no extra index. Django already indexes the user FK, which is
    # all the picker's filter needs, and a player has a handful of walls, so
    # ordering them by last_activity is a trivial sort rather than a scan. An
    # index on last_activity would only cost us HOT updates for no gain.

    def __str__(self):
        return "Wall {0}: {1} {2}s for {3} ({4}/{5})".format(
            self.pk,
            self.lexicon.lexiconName,
            self.word_length,
            self.user.username,
            self.solved_count,
            self.num_alphagrams,
        )


class InfiniteWallChunk(models.Model):
    """
    One zoomable rectangle that a player has visited at least once.

    `answers` holds only cell, alphagram and word strings, roughly 5 KB.
    Definitions, hooks and lexicon symbols are never persisted here; they are
    re-fetched from the word server on each load the way
    wordwalls.game.load_questions already does, so display metadata cannot go
    stale. Once every cell is solved `answers` is emptied: nothing left to guess
    needs it, and it is derivable from (seed, cell) anyway. The table has
    toast_tuple_target = 128 (migration 0019), so answers always sits out of
    line, still compressed, and a guess rewrites only the few dozen bytes of
    progress below.

    Progress is two bitmasks, both LSB-first like infinite_perm.get_bit:
    `solved_cells` has bit (g - first cell of the rectangle) set once cell g is
    solved, and `solved_word_bits` has one bit per word, numbered in `answers`
    order (see infinite_perm.word_bits).
    """

    wall = models.ForeignKey(
        InfiniteWall, on_delete=models.CASCADE, related_name="chunk_set"
    )
    chunk_index = models.IntegerField()
    # Cell-ordered: [{"g": cell, "q": alphagram, "a": [word, ...]}, ...]
    answers = models.JSONField()
    solved_cells = models.BinaryField(default=b"")
    solved_word_bits = models.BinaryField(default=b"")

    class Meta:
        unique_together = ("wall", "chunk_index")

    def __str__(self):
        return "Wall {0} chunk {1}".format(self.wall_id, self.chunk_index)
