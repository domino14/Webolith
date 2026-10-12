"""
Move Great Wall progress off the wall row and onto its rectangles.

Previously every solved alphagram rewrote the wall's whole solved_bitmap
(ceil(n / 8) bytes, TOASTed past ~2 KB) and appended to the rectangle's
solved_words list. Now a solve writes two small per-rectangle bitmasks plus the
wall's solved_count.

The merge below is an OR of the legacy state into the new masks. Bits only ever
go from 0 to 1, so it is idempotent and safe to repeat after new progress has
been written -- 0020 runs it again to pick up anything the old code wrote
mid-deploy, then drops the legacy columns.

Self-contained on purpose: a data migration must not depend on app code that may
change later.
"""

import logging

from django.db import migrations, models

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


def merge_legacy_progress(apps, schema_editor):
    InfiniteWall = apps.get_model("wordwalls", "InfiniteWall")
    InfiniteWallChunk = apps.get_model("wordwalls", "InfiniteWallChunk")

    for wall in InfiniteWall.objects.all().iterator():
        legacy = bytes(wall.solved_bitmap or b"")
        size = wall.chunk_w * wall.chunk_h
        solved_total = 0

        for chunk in InfiniteWallChunk.objects.filter(wall=wall).iterator():
            base = chunk.chunk_index * size
            last = min(base + size, wall.num_alphagrams)

            cells = _padded(chunk.solved_cells, size)
            for g in range(base, last):
                if (g >> 3) < len(legacy) and _get_bit(legacy, g):
                    _set_bit(cells, g - base)

            answers = chunk.answers or []
            words = [word for entry in answers for word in entry["a"]]
            word_index = {word: i for i, word in enumerate(words)}
            word_mask = _padded(chunk.solved_word_bits, len(words))
            for word in chunk.solved_words or []:
                if word in word_index:
                    _set_bit(word_mask, word_index[word])

            chunk.solved_cells = bytes(cells)
            chunk.solved_word_bits = bytes(word_mask)

            # Same pruning the game now does on clearing a rectangle.
            cleared = int.from_bytes(bytes(cells), "little").bit_count()
            if answers and cleared >= last - base:
                chunk.answers = []
                chunk.solved_word_bits = b""
            # answers is always rewritten, even when unchanged: the new
            # toast_tuple_target only applies to rows written after it, so this
            # is what moves existing values out of line.
            chunk.save(update_fields=["solved_cells", "solved_word_bits", "answers"])
            solved_total += cleared

        if solved_total == wall.solved_count:
            continue
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
            continue
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


class Migration(migrations.Migration):

    dependencies = [
        ("wordwalls", "0018_infinitewall_infinitewallchunk"),
    ]

    operations = [
        migrations.AddField(
            model_name="infinitewallchunk",
            name="solved_cells",
            field=models.BinaryField(default=b""),
        ),
        migrations.AddField(
            model_name="infinitewallchunk",
            name="solved_word_bits",
            field=models.BinaryField(default=b""),
        ),
        # AddField's default only backfills existing rows; Django 4.2 then
        # drops it from the column. Old pods keep serving until the rollout
        # finishes (and indefinitely if it fails), and their inserts don't
        # name these columns -- so without a database default, opening a
        # new rectangle there would hit the NOT NULL. Empty masks are what
        # the new code expects anyway, and 0020 merges what those pods wrote.
        migrations.RunSQL(
            "ALTER TABLE wordwalls_infinitewallchunk "
            "ALTER COLUMN solved_cells SET DEFAULT ''::bytea, "
            "ALTER COLUMN solved_word_bits SET DEFAULT ''::bytea",
            "ALTER TABLE wordwalls_infinitewallchunk "
            "ALTER COLUMN solved_cells DROP DEFAULT, "
            "ALTER COLUMN solved_word_bits DROP DEFAULT",
        ),
        # Toast any row over 128 bytes, so answers (still compressed) always
        # sits out of line and a guess, which rewrites only the small progress
        # columns, never copies it. STORAGE EXTERNAL would do the same but give
        # up compression, ~2.5x the space. Before the merge, which rewrites
        # every existing row under the new setting.
        migrations.RunSQL(
            "ALTER TABLE wordwalls_infinitewallchunk SET (toast_tuple_target = 128)",
            "ALTER TABLE wordwalls_infinitewallchunk RESET (toast_tuple_target)",
        ),
        migrations.RunPython(merge_legacy_progress, migrations.RunPython.noop),
    ]
