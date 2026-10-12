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
"""

import importlib

from django.db import migrations

# 0019 is applied history and will not change; reusing its merge guarantees the
# rerun is identical to the original.
merge_legacy_progress = importlib.import_module(
    "wordwalls.migrations.0019_infinitewallchunk_progress_masks"
).merge_legacy_progress


class Migration(migrations.Migration):

    dependencies = [
        ("wordwalls", "0019_infinitewallchunk_progress_masks"),
    ]

    operations = [
        # Picks up anything pods running pre-0019 code wrote to the legacy
        # columns after 0019 ran and before the rollout replaced them. Bits only
        # go 0 -> 1, so this is safe even though there should be nothing left.
        migrations.RunPython(merge_legacy_progress, migrations.RunPython.noop),
        # Once the fields leave the models, inserts stop naming these columns,
        # so they need database defaults to satisfy NOT NULL until 0021.
        migrations.RunSQL(
            "ALTER TABLE wordwalls_infinitewall "
            "ALTER COLUMN solved_bitmap SET DEFAULT ''::bytea; "
            "ALTER TABLE wordwalls_infinitewallchunk "
            "ALTER COLUMN solved_words SET DEFAULT '[]'::jsonb",
            "ALTER TABLE wordwalls_infinitewall "
            "ALTER COLUMN solved_bitmap DROP DEFAULT; "
            "ALTER TABLE wordwalls_infinitewallchunk "
            "ALTER COLUMN solved_words DROP DEFAULT",
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
