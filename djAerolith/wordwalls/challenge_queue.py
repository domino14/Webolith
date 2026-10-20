"""
Which bingos the live daily challenges still need to ask, and how often.

A bingo's difficulty is only as good as the daily-challenge data behind it.
Each ask by `eff` players who miss it with probability p tells us
eff * p * (1 - p) about its difficulty (the Fisher information of a binomial
on the logit scale); questions near a 50% miss rate are the most informative.
A bingo is short of data while the information behind its *current* answer set
is below `target`. The default target, 15, is about what one live NWL ask
delivers (~80 players, ~30% missing), which puts ~90% of bingos within 10
percentile points of where more data would settle them.

Data is keyed by (alphagram, answer set): when an alphagram gains or loses an
anagram, its old data describes a different question and doesn't count. CSW
also counts NWL asks of the same answer set, since CSW has far fewer players.
"""

import json
import math
import secrets
from collections import defaultdict
from dataclasses import dataclass
from datetime import timedelta

from django.db import connection, transaction
from django.utils import timezone

from base.models import Lexicon
from lib.wdb_interface.wdb_helper import word_search
from lib.wdb_interface.word_searches import SearchDescription
from wordwalls.models import ChallengeCycle, ChallengeQueueItem

DEFAULT_TARGET = 15.0
BINGO_LENGTHS = (7, 8)
LIVE_CHALLENGES = ("Today's 7s", "Today's 8s")
# A bingo nobody has seen under its current answer set is assumed to be about
# this much harder (in logits) than an average one of its length. Most are new
# words, which players miss more for a few years.
UNASKED_PENALTY = 0.5
# Pseudo-players pulling a thinly asked bingo's miss rate toward the average.
PRIOR_PLAYERS = 10
# Fallback turnout if a family has no live challenges in the last year.
DEFAULT_PLAYERS = 50


def family(lexicon_name):
    if lexicon_name.startswith("CSW"):
        return "CSW"
    if lexicon_name.startswith(("NWL", "OWL", "America")):
        return "NWL"
    return None


# Whose asks count toward a family's bingos.
SOURCE_FAMILIES = {"NWL": ("NWL",), "CSW": ("CSW", "NWL")}


@dataclass
class Need:
    alphagram: str
    asks_needed: int
    new_word: bool
    info: float


def lexicon_ids(families):
    return [
        lex.pk for lex in Lexicon.objects.all() if family(lex.lexiconName) in families
    ]


# Only challenges in these lexica, before the players are counted: counting
# every leaderboard first takes several times as long.
CHALLENGES_CTE = """
WITH ch AS (
    SELECT dc.id, dc.date, dn.name, dc.alphagrams
    FROM wordwalls_dailychallenge dc
    JOIN wordwalls_dailychallengename dn ON dn.id = dc.name_id
    WHERE dc.lexicon_id = ANY(%s) AND dn.name = ANY(%s)
), players AS (
    SELECT lb.challenge_id, COUNT(*) AS n,
           COUNT(*) FILTER (WHERE e.score = 0) AS z
    FROM wordwalls_dailychallengeleaderboardentry e
    JOIN wordwalls_dailychallengeleaderboard lb ON lb.id = e.board_id
    WHERE lb.challenge_id IN (SELECT id FROM ch)
    GROUP BY lb.challenge_id
)
"""

ASKS_SQL = CHALLENGES_CTE + """
SELECT q->>'q',
       (SELECT string_agg(a, ' ' ORDER BY a)
        FROM jsonb_array_elements_text(q->'a') a),
       SUM(p.n - p.z),
       SUM(GREATEST(COALESCE(mb."numTimesMissed", 0) - p.z, 0))
FROM ch
JOIN players p ON p.challenge_id = ch.id
CROSS JOIN jsonb_array_elements(ch.alphagrams::jsonb) q
LEFT JOIN wordwalls_dailychallengemissedbingos mb
    ON mb.challenge_id = ch.id AND mb.alphagram_string = q->>'q'
WHERE p.n > p.z
GROUP BY 1, 2
"""


def collect_asks(lex_ids):
    """
    {(alphagram, sorted answers joined by spaces): [players, misses]} over
    every live 7s/8s challenge in these lexica.

    Players who scored zero missed everything (they mostly didn't play), so
    they're taken out of both counts.
    """
    with connection.cursor() as cursor:
        cursor.execute(ASKS_SQL, [lex_ids, list(LIVE_CHALLENGES)])
        return {(a, ans): [int(eff), int(m)] for a, ans, eff, m in cursor.fetchall()}


TURNOUT_SQL = CHALLENGES_CTE + """
SELECT ch.name, percentile_cont(0.5) WITHIN GROUP (ORDER BY p.n - p.z)
FROM ch
JOIN players p ON p.challenge_id = ch.id
WHERE ch.date >= %s
GROUP BY ch.name
"""


def typical_turnout(lex_ids, today):
    """Median players per live challenge over the last year, by length."""
    with connection.cursor() as cursor:
        cursor.execute(
            TURNOUT_SQL,
            [lex_ids, list(LIVE_CHALLENGES), today - timedelta(days=365)],
        )
        rows = dict(cursor.fetchall())
    return {
        length: rows.get(f"Today's {length}s") or DEFAULT_PLAYERS
        for length in BINGO_LENGTHS
    }


def current_bingos(lex, length):
    """[(alphagram, answers key, has a word new in this lexicon)]"""
    n = json.loads(lex.lengthCounts).get(str(length), 0)
    if not n:
        return []
    qs = word_search(
        [
            SearchDescription.lexicon(lex),
            SearchDescription.length(length, length),
            SearchDescription.probability_range(1, n),
        ],
        expand=True,
    )
    return [
        (
            q.alphagram.alphagram,
            " ".join(sorted(w.word for w in q.answers)),
            any("+" in w.lexicon_symbols for w in q.answers),
        )
        for q in qs.questions_array()
    ]


def logit(p):
    return math.log(p / (1 - p))


def sigmoid(x):
    return 1 / (1 + math.exp(-x))


def compute_needs(bingos, asks, players_per_ask, target=DEFAULT_TARGET):
    """
    The bingos (from current_bingos) still short of `target`, with how many
    more live asks each needs at `players_per_ask` players apiece.
    """
    seen = [asks[(a, ans)] for a, ans, _ in bingos if (a, ans) in asks]
    eff_total = sum(eff for eff, _ in seen)
    if eff_total:
        mean_p = min(max(sum(m for _, m in seen) / eff_total, 0.02), 0.98)
    else:
        mean_p = 0.35
    needs = []
    for alpha, ans, new_word in bingos:
        eff, m = asks.get((alpha, ans), (0, 0))
        if eff:
            p = (m + PRIOR_PLAYERS * mean_p) / (eff + PRIOR_PLAYERS)
        else:
            p = sigmoid(logit(mean_p) + (UNASKED_PENALTY if new_word else 0))
        info = eff * p * (1 - p)
        if info >= target:
            continue
        per_ask = players_per_ask * p * (1 - p)
        needs.append(Need(alpha, math.ceil((target - info) / per_ask), new_word, info))
    # Least-known first among equals.
    needs.sort(key=lambda nd: (not nd.new_word, nd.info))
    return needs


def save_queue(lex, needs, slots=None, balance=True, prune=False, replace=False):
    """
    Upsert `needs` (Need-likes with .alphagram, .asks_needed, .new_word and
    optionally .priority) into lex's queue and make sure each length has a
    ChallengeCycle. A bingo's last_asked survives the upsert, so a reload
    can't ask it again sooner than the scheduler's spacing allows.

    prune: drop this lexicon's queued bingos that aren't in `needs` (they have
    enough data now). replace: drop the whole queue first.

    Returns {length: (cycle, created, bingos, asks)}.
    """
    items = [
        ChallengeQueueItem(
            lexicon=lex,
            alphagram=nd.alphagram,
            word_length=len(nd.alphagram),
            asks_remaining=nd.asks_needed,
            new_word=nd.new_word,
            priority=(
                nd.priority
                if getattr(nd, "priority", None) is not None
                else (0 if nd.new_word else 1)
            ),
        )
        for nd in needs
        if nd.asks_needed > 0
    ]
    by_length = defaultdict(list)
    for item in items:
        by_length[item.word_length].append(item)

    summary = {}
    with transaction.atomic():
        queue = ChallengeQueueItem.objects.filter(lexicon=lex)
        if replace:
            queue.delete()
        elif prune:
            queue.exclude(alphagram__in=[i.alphagram for i in items]).delete()
        ChallengeQueueItem.objects.bulk_create(
            items,
            update_conflicts=True,
            unique_fields=["lexicon", "alphagram"],
            update_fields=["asks_remaining", "new_word", "priority"],
        )
        for length in sorted(by_length):
            cycle, created = ChallengeCycle.objects.get_or_create(
                lexicon=lex,
                word_length=length,
                defaults={"seed": secrets.randbits(63)},
            )
            if slots is not None:
                cycle.priority_slots = slots
            cycle.balance = balance
            cycle.save()
            queued = by_length[length]
            summary[length] = (
                cycle,
                created,
                len(queued),
                sum(i.asks_remaining for i in queued),
            )
    return summary


def describe(lex, summary):
    lines = []
    for length, (cycle, created, bingos, asks) in summary.items():
        slots = cycle.priority_slots
        days = -(-asks // slots) if slots else 0
        lines.append(
            f"{lex} {length}s: {bingos} bingos, {asks} asks queued, "
            f"{slots}/challenge -> ~{days} days "
            f"({'new' if created else 'existing'} cycle, "
            f"balance {'on' if cycle.balance else 'off'})"
        )
    return lines


def build(lex, target=DEFAULT_TARGET, today=None, players=None):
    """
    Needs for every 7 and 8 in `lex`, from all the data we have. `players`
    overrides the expected turnout per live ask.
    """
    today = today or timezone.localtime(timezone.now()).date()
    fam = family(lex.lexiconName)
    if fam is None:
        raise ValueError(f"{lex} isn't in a lexicon family with challenge data")
    asks = collect_asks(lexicon_ids(SOURCE_FAMILIES[fam]))
    if players:
        turnout = {length: players for length in BINGO_LENGTHS}
    else:
        turnout = typical_turnout(lexicon_ids((fam,)), today)
    needs = []
    for length in BINGO_LENGTHS:
        needs += compute_needs(
            current_bingos(lex, length), asks, turnout[length], target
        )
    return needs, turnout
