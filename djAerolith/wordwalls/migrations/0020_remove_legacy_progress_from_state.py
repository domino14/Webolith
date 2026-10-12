"""
Retire the legacy Great Wall progress columns from Django, step 1 of 2.

InfiniteWall.solved_bitmap and InfiniteWallChunk.solved_words were superseded
by the per-rectangle masks in 0019. Dropping them in one migration would break
the deploy: the migrate Job runs before the rollout, and the still-running pods'
models name these columns in every query on these tables. So:

  0020 (this): merge any legacy progress once more, give the columns database
       defaults, and remove them from Django's model state only. No data is
       deleted, and code from either side of this deploy works against it.
  0021 (next release): DROP the columns, once no running code names them.

This runs while players are guessing, so it is not atomic. As one transaction
it deadlocked in prod: it held row locks on every rectangle it had rewritten
until the end, then needed an ACCESS EXCLUSIVE lock for the ALTERs, while a
guess -- holding its wall's lock and a share lock on the rectangle table --
waited for one of those rows. Now each wall is merged in its own short
transaction, locking the wall first exactly as the game does and writing only
rectangles whose progress actually changes; the ALTERs run afterwards with no
row locks held.
"""

import logging

from django.db import migrations, transaction

logger = logging.getLogger(__name__)


def _padded(buf, nbits):
    out = bytearray(buf or b"")
    need = (nbits + 7) // 8
    if len(out) < need:
        out.extend(bytes(need - len(out)))
    return out


def _get_bit(buf, g):
    return bool((buf[g >> 3] >> (g & 7)) & 1)


def _set_bit(buf, g):
    buf[g >> 3] |= 1 << (g & 7)


def _popcount(buf):
    return int.from_bytes(bytes(buf), "little").bit_count()


def _merge_wall(InfiniteWall, InfiniteWallChunk, wall_id):
    # Same lock order as every game write (infinite_game.locked_wall): the
    # wall row first, then its rectangles.
    wall = InfiniteWall.objects.select_for_update().get(pk=wall_id)
    legacy = bytes(wall.solved_bitmap or b"")
    size = wall.chunk_w * wall.chunk_h
    solved_total = 0

    for chunk in InfiniteWallChunk.objects.filter(wall=wall):
        base = chunk.chunk_index * size
        last = min(base + size, wall.num_alphagrams)

        old_cells = bytes(chunk.solved_cells or b"")
        cells = _padded(old_cells, size)
        for g in range(base, last):
            if (g >> 3) < len(legacy) and _get_bit(legacy, g):
                _set_bit(cells, g - base)

        answers = chunk.answers or []
        words = [word for entry in answers for word in entry["a"]]
        word_index = {word: i for i, word in enumerate(words)}
        old_words = bytes(chunk.solved_word_bits or b"")
        word_mask = _padded(old_words, len(words))
        for word in chunk.solved_words or []:
            if word in word_index:
                _set_bit(word_mask, word_index[word])

        cleared = _popcount(cells)
        solved_total += cleared
        # Bits only get added, so a changed count means a changed mask.
        fields = set()
        if cleared != _popcount(old_cells):
            chunk.solved_cells = bytes(cells)
            fields.add("solved_cells")
        if _popcount(word_mask) != _popcount(old_words):
            chunk.solved_word_bits = bytes(word_mask)
            fields.add("solved_word_bits")
        # Same pruning the game does on clearing a rectangle.
        if answers and cleared >= last - base:
            chunk.answers = []
            chunk.solved_word_bits = b""
            fields |= {"answers", "solved_word_bits"}
        if fields:
            chunk.save(update_fields=sorted(fields))

    if solved_total == wall.solved_count:
        return
    # A finished wall's count is final, and the leaderboard and picker read
    # it; its rectangles may be gone (seeded or hand-made walls), so never
    # recount one from them.
    if wall.state == "D":
        logger.warning(
            "event=infinite_wall_count_mismatch_done wall=%s count=%s bits=%s",
            wall.pk,
            wall.solved_count,
            solved_total,
        )
        return
    # A running wall's count must match its bits, or completion would fire
    # early or never.
    logger.warning(
        "event=infinite_wall_count_corrected wall=%s was=%s now=%s",
        wall.pk,
        wall.solved_count,
        solved_total,
    )
    wall.solved_count = solved_total
    wall.save(update_fields=["solved_count"])


def merge_legacy_progress(apps, schema_editor):
    """
    OR the legacy columns into the masks, one wall per transaction.

    Bits only go 0 -> 1, so this is idempotent, and rerunning it after a
    failure part way through is safe.
    """
    InfiniteWall = apps.get_model("wordwalls", "InfiniteWall")
    InfiniteWallChunk = apps.get_model("wordwalls", "InfiniteWallChunk")
    wall_ids = list(InfiniteWall.objects.order_by("pk").values_list("pk", flat=True))
    for wall_id in wall_ids:
        with transaction.atomic():
            _merge_wall(InfiniteWall, InfiniteWallChunk, wall_id)


class Migration(migrations.Migration):

    atomic = False

    dependencies = [
        ("wordwalls", "0019_infinitewallchunk_progress_masks"),
    ]

    operations = [
        # Picks up anything pods running pre-0019 code wrote to the legacy
        # columns after 0019 ran and before the rollout replaced them.
        migrations.RunPython(merge_legacy_progress, migrations.RunPython.noop),
        # Once the fields leave the models, inserts stop naming these columns,
        # so they need database defaults to satisfy NOT NULL until 0021. Each
        # statement commits on its own; the lock timeout makes an ALTER fail
        # (and the Job retry) rather than queue every query on the table
        # behind it if some transaction holds the table for long.
        migrations.RunSQL(
            [
                "SET lock_timeout = '5s'",
                "ALTER TABLE wordwalls_infinitewall "
                "ALTER COLUMN solved_bitmap SET DEFAULT ''::bytea",
                "ALTER TABLE wordwalls_infinitewallchunk "
                "ALTER COLUMN solved_words SET DEFAULT '[]'::jsonb",
                "RESET lock_timeout",
            ],
            [
                "ALTER TABLE wordwalls_infinitewall "
                "ALTER COLUMN solved_bitmap DROP DEFAULT",
                "ALTER TABLE wordwalls_infinitewallchunk "
                "ALTER COLUMN solved_words DROP DEFAULT",
            ],
        ),
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.RemoveField(model_name="infinitewall", name="solved_bitmap"),
                migrations.RemoveField(
                    model_name="infinitewallchunk", name="solved_words"
                ),
            ],
            database_operations=[],
        ),
    ]
