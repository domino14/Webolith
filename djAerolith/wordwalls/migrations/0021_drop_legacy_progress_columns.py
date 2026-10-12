"""
Drop the legacy Great Wall progress columns, step 2 of 2.

0020 merged InfiniteWall.solved_bitmap and InfiniteWallChunk.solved_words into
the per-rectangle masks, gave them database defaults and took them out of the
models, and code that no longer names them has been serving since. Run
check_great_wall_storage first: its "legacy columns" line should read True and
"no problems found" -- after this, there is nothing left to compare against.

DROP COLUMN only updates the catalog, so it is quick, but it still needs an
ACCESS EXCLUSIVE lock. Like 0020 this is not atomic and uses a lock timeout,
so a busy table makes the migration fail and the Job retry rather than queue
the site behind it; IF EXISTS makes the retry safe if one column already went.

Reversing recreates the columns empty, as 0020 left them for inserts; the data
in them is not recoverable from here (it is all in the masks).
"""

from django.db import migrations


class Migration(migrations.Migration):

    atomic = False

    dependencies = [
        ("wordwalls", "0020_remove_legacy_progress_from_state"),
    ]

    operations = [
        migrations.RunSQL(
            [
                "SET lock_timeout = '5s'",
                "ALTER TABLE wordwalls_infinitewall DROP COLUMN IF EXISTS solved_bitmap",
                "ALTER TABLE wordwalls_infinitewallchunk "
                "DROP COLUMN IF EXISTS solved_words",
                "RESET lock_timeout",
            ],
            [
                "ALTER TABLE wordwalls_infinitewall "
                "ADD COLUMN IF NOT EXISTS solved_bitmap bytea NOT NULL DEFAULT ''::bytea",
                "ALTER TABLE wordwalls_infinitewallchunk "
                "ADD COLUMN IF NOT EXISTS solved_words jsonb NOT NULL DEFAULT '[]'::jsonb",
            ],
        ),
    ]
