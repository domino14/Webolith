"""
Read-only consistency check for Great Wall progress storage.

Run it after migration 0019 and again before 0020 drops the legacy columns.
While InfiniteWall.solved_bitmap still exists it is the reference copy: every
legacy bit must also be set in the rectangles' new masks (new progress may add
bits, never remove them). Exits non-zero if anything is wrong.
"""

from django.core.management.base import BaseCommand, CommandError

from wordwalls.infinite_game import InfiniteWallGame
from wordwalls.infinite_models import InfiniteWall, InfiniteWallChunk
from wordwalls.infinite_perm import assemble_bitmap, get_bit, popcount, word_bits


def _has_field(model, name):
    return any(f.name == name for f in model._meta.get_fields())


class Command(BaseCommand):
    help = "Check Great Wall progress storage for lost or inconsistent progress"

    def handle(self, *args, **options):
        legacy_bitmap = _has_field(InfiniteWall, "solved_bitmap")
        legacy_words = _has_field(InfiniteWallChunk, "solved_words")
        game = InfiniteWallGame()
        problems = []
        walls = chunks = pruned = 0

        for wall in InfiniteWall.objects.all().iterator():
            walls += 1
            geometry = game.geometry(wall)
            size = geometry.chunk_size
            rows = list(InfiniteWallChunk.objects.filter(wall=wall))
            chunks += len(rows)

            new = int.from_bytes(
                assemble_bitmap(
                    geometry.n, size, [(c.chunk_index, c.solved_cells) for c in rows]
                ),
                "little",
            )
            bits = new.bit_count()

            if legacy_bitmap:
                old = int.from_bytes(bytes(wall.solved_bitmap or b""), "little")
                lost = (old & ~new).bit_count()
                if lost:
                    problems.append(
                        "wall {0}: {1} legacy solved cells missing".format(
                            wall.pk, lost
                        )
                    )

            if wall.state == InfiniteWall.DONE:
                if wall.solved_count != wall.num_alphagrams:
                    problems.append(
                        "wall {0}: done but count {1} != n {2}".format(
                            wall.pk, wall.solved_count, wall.num_alphagrams
                        )
                    )
            elif bits != wall.solved_count:
                problems.append(
                    "wall {0}: {1} solved bits but count {2}".format(
                        wall.pk, bits, wall.solved_count
                    )
                )

            for chunk in rows:
                cells = geometry.cells_in_chunk(chunk.chunk_index)
                cleared = popcount(chunk.solved_cells) >= len(cells)
                where = "wall {0} rect {1}".format(wall.pk, chunk.chunk_index)
                if not chunk.answers:
                    pruned += 1
                    if not cleared:
                        problems.append(where + ": answers dropped but not cleared")
                    continue

                numbered = word_bits(chunk.answers)
                word_mask = bytes(chunk.solved_word_bits)
                if len(word_mask) * 8 < len(numbered):
                    problems.append(where + ": word mask too short")
                    continue
                found = {w for w, (bit, _e) in numbered.items() if get_bit(word_mask, bit)}

                if legacy_words:
                    missing = set(chunk.solved_words or []) - found
                    if missing:
                        problems.append(
                            "{0}: {1} legacy found words missing".format(
                                where, len(missing)
                            )
                        )

                # A cell is solved exactly when all of its words are found.
                base = chunk.chunk_index * size
                for entry in chunk.answers:
                    all_found = found.issuperset(entry["a"])
                    if all_found != get_bit(bytes(chunk.solved_cells), entry["g"] - base):
                        problems.append(
                            "{0}: cell {1} words/bit disagree".format(where, entry["g"])
                        )

        self.stdout.write(
            "checked {0} walls, {1} rectangles ({2} cleared and pruned); "
            "legacy columns: bitmap={3} words={4}".format(
                walls, chunks, pruned, legacy_bitmap, legacy_words
            )
        )
        for problem in problems[:200]:
            self.stdout.write("PROBLEM " + problem)
        if problems:
            raise CommandError("{0} problems found".format(len(problems)))
        self.stdout.write(self.style.SUCCESS("no problems found"))
