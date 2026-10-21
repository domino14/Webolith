#!/usr/bin/env bash
# Export the live "Today's 7s" / "Today's 8s" results that difficulty.py
# reads, through bin/proddb (a read-only connection to the production DB).
#
#   analysis/export_challenge_data.sh ~/difficulty-data
#
# Writes challenges.csv, entries.csv and missed.csv into the given directory.
# No user ids are exported: entries.csv is just (challenge, score).

set -euo pipefail

OUT="${1:?usage: $0 OUTPUT_DIR}"
mkdir -p "$OUT"
OUT="$(cd "$OUT" && pwd)"
PRODDB="$(cd "$(dirname "$0")/.." && pwd)/bin/proddb"

LIVE="(select id from wordwalls_dailychallengename where name in ('Today''s 7s', 'Today''s 8s'))"

"$PRODDB" \
  -c "\copy (select dc.id, l.\"lexiconName\" as lexicon, n.name, dc.date, dc.alphagrams from wordwalls_dailychallenge dc join base_lexicon l on l.id = dc.lexicon_id join wordwalls_dailychallengename n on n.id = dc.name_id where dc.name_id in $LIVE order by dc.id) to '$OUT/challenges.csv' csv header" \
  -c "\copy (select lb.challenge_id, e.score from wordwalls_dailychallengeleaderboardentry e join wordwalls_dailychallengeleaderboard lb on lb.id = e.board_id join wordwalls_dailychallenge dc on dc.id = lb.challenge_id where dc.name_id in $LIVE) to '$OUT/entries.csv' csv header" \
  -c "\copy (select mb.challenge_id, mb.alphagram_string as alphagram, mb.\"numTimesMissed\" as missed from wordwalls_dailychallengemissedbingos mb join wordwalls_dailychallenge dc on dc.id = mb.challenge_id where dc.name_id in $LIVE) to '$OUT/missed.csv' csv header"

wc -l "$OUT"/*.csv
