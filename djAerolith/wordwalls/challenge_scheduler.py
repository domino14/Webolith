"""
Scheduled questions for the live daily challenges.

A random draw of 50 a day takes years to reach every alphagram of a length,
repeats some within days, and never gets new words asked often enough to
measure them. So each live challenge instead walks a ChallengeCycle: a seeded
permutation of everything it can ask, taken in order, so each alphagram comes
up exactly once per pass. Each pass is shuffled anew, so the same questions
don't come back together. Cycles are made on first use, one per lexicon,
challenge and length; turning one's `enabled` off sends that challenge back to
a random draw.

- Today's Ns walk every alphagram of length N. Today's 7s and 8s also take up
  to `priority_slots` bingos from the ChallengeQueueItem queue first (bingos
  that need asks before their difficulty can be trusted), plus one easy
  partner (difficulty 1-50) per new-word bingo among them when the cycle
  balances: new-word bingos are missed ~11 points more often, and a partner
  from the easier half cancels that out.
- Bingo Marathon walks its own 7s and 8s cycles, 50 of each, apart from the
  Today's 7s and 8s cycles. It doesn't touch the queue: only Today's 7s and 8s
  results feed the difficulty data.
- All-time and High Probability Toughies walk the set of bingos they draw
  from. That set changes when difficulties are rebuilt, and a changed set
  starts a fresh pass.

Past-date replays, the Week's Bingo Toughies (not a random draw), and the
blank bingo and word builder challenges are generated as before.

Planning writes nothing but a new cycle row. The caller saves the
DailyChallenge and then calls plan.commit(), so if two requests race to create
the same challenge only the one whose row saved advances anything.
"""

import hashlib
import json
import logging
import random
import re
import secrets
import struct
from dataclasses import dataclass
from datetime import timedelta

from django.db.models import F, Q
from django.utils import timezone

from lib.domain import Questions
from lib.wdb_interface.exceptions import WDBError
from lib.wdb_interface.wdb_helper import (
    questions_from_alphagrams,
    questions_from_probability_list,
    word_search,
)
from lib.wdb_interface.word_searches import SearchDescription
from wordwalls.challenges import toughies_pool
from wordwalls.infinite_perm import WallPermutation
from wordwalls.models import ChallengeCycle, ChallengeQueueItem, DailyChallengeName

logger = logging.getLogger(__name__)

NUM_QUESTIONS = 50
# The lengths the queue serves, and only from Today's Ns.
QUEUE_LENGTHS = (7, 8)
MARATHON_LENGTHS = (7, 8)
POOL_CHALLENGES = (
    DailyChallengeName.ALLTIME_BINGO_TOUGHIES,
    DailyChallengeName.HIGHPROB_TOUGHIES,
)
# A cycle over a set of bingos rather than a whole length.
POOL_LENGTH = 0
# A queued bingo waits this long between asks, so its asks come from different
# days' players rather than the same crowd twice.
MIN_DAYS_BETWEEN_ASKS = 7
EASY_MAX_DIFFICULTY = 50


def new_seed():
    return secrets.randbits(63)


@dataclass
class CycleMove:
    cycle: ChallengeCycle
    steps: int
    # Set when a pool cycle starts over on a new set of bingos.
    restart_seed: int = None
    pool_hash: str = ""


class SchedulePlan:
    def __init__(self, questions, moves, asked_ids=(), gone_ids=(), date=None):
        self.questions = questions
        self.moves = moves
        self.asked_ids = list(asked_ids)
        # Queued alphagrams the word server no longer knows; retire them.
        self.gone_ids = list(gone_ids)
        self.date = date

    @property
    def cycle_steps(self):
        return sum(mv.steps for mv in self.moves)

    def commit(self):
        for mv in self.moves:
            cycles = ChallengeCycle.objects.filter(pk=mv.cycle.pk)
            if mv.restart_seed is not None:
                cycles.update(
                    seed=mv.restart_seed, pool_hash=mv.pool_hash, cursor=mv.steps
                )
            else:
                cycles.update(cursor=F("cursor") + mv.steps)
        if self.asked_ids:
            ChallengeQueueItem.objects.filter(pk__in=self.asked_ids).update(
                asks_remaining=F("asks_remaining") - 1, last_asked=self.date
            )
        if self.gone_ids:
            ChallengeQueueItem.objects.filter(pk__in=self.gone_ids).update(
                asks_remaining=0
            )


def get_cycle(lex, challenge_name, word_length):
    """The challenge's cycle, made on first use; None if it's turned off."""
    cycle, _ = ChallengeCycle.objects.get_or_create(
        lexicon=lex,
        challenge=challenge_name,
        word_length=word_length,
        defaults={"seed": new_seed()},
    )
    return cycle if cycle.enabled else None


def plan_scheduled_challenge(challenge_name, lex, challenge_date):
    """
    A SchedulePlan for a live challenge that walks a cycle, else None (and the
    caller falls back to the usual generation).
    """
    if challenge_date != timezone.localtime(timezone.now()).date():
        return None
    try:
        return plan_challenge(challenge_name, lex, challenge_date)
    except WDBError:
        logger.exception("[event=scheduled-challenge-error]")
        return None


def plan_challenge(challenge_name, lex, date):
    counts = json.loads(lex.lengthCounts)
    m = re.match("Today's (?P<length>[0-9]+)s", challenge_name.name)
    if m:
        length = int(m.group("length"))
        if not counts.get(str(length)):
            return None
        cycle = get_cycle(lex, challenge_name, length)
        return cycle and build_plan(cycle, lex, length, date)
    if challenge_name.name == DailyChallengeName.BINGO_MARATHON:
        if not all(counts.get(str(length)) for length in MARATHON_LENGTHS):
            return None
        cycles = [get_cycle(lex, challenge_name, L) for L in MARATHON_LENGTHS]
        return marathon_plan(cycles, lex, date) if all(cycles) else None
    if challenge_name.name in POOL_CHALLENGES:
        cycle = get_cycle(lex, challenge_name, POOL_LENGTH)
        return cycle and pool_plan(cycle, toughies_pool(lex, challenge_name.name), date)
    return None


def build_plan(cycle, lex, word_length, date, num_questions=NUM_QUESTIONS):
    """A Today's Ns: queued bingos and their partners, then the cycle."""
    n = json.loads(lex.lengthCounts)[str(word_length)]
    chosen = Questions()
    taken = set()
    uses_queue = word_length in QUEUE_LENGTHS

    queued = []
    if uses_queue and cycle.priority_slots:
        queued = list(
            ChallengeQueueItem.objects.filter(
                lexicon=lex, word_length=word_length, asks_remaining__gt=0
            )
            .filter(
                Q(last_asked__isnull=True)
                | Q(last_asked__lte=date - timedelta(days=MIN_DAYS_BETWEEN_ASKS))
            )
            .order_by("priority", F("last_asked").asc(nulls_first=True), "id")[
                : cycle.priority_slots
            ]
        )
    asked_ids, gone_ids, num_new = [], [], 0
    if queued:
        found = {
            q.alphagram.alphagram: q
            for q in questions_from_alphagrams(
                lex, [item.alphagram for item in queued]
            ).questions_array()
        }
        for item in queued:
            q = found.get(item.alphagram)
            if q is None:
                gone_ids.append(item.pk)
                continue
            chosen.append(q)
            taken.add(item.alphagram)
            asked_ids.append(item.pk)
            num_new += item.new_word

    if cycle.balance and num_new:
        for q in easy_partners(lex, word_length, n, num_new, taken):
            chosen.append(q)
            taken.add(q.alphagram.alphagram)

    filled, steps = walk_cycle(
        cycle, lex, word_length, n, num_questions - len(chosen), taken
    )
    chosen.extend(filled)
    if uses_queue:
        # A queued bingo that came up anyway (as a partner or in the cycle)
        # has been asked all the same.
        asked_ids += (
            ChallengeQueueItem.objects.filter(
                lexicon=lex,
                word_length=word_length,
                asks_remaining__gt=0,
                alphagram__in=taken,
            )
            .exclude(pk__in=asked_ids)
            .values_list("pk", flat=True)
        )
    chosen.shuffle()
    return SchedulePlan(chosen, [CycleMove(cycle, steps)], asked_ids, gone_ids, date)


def marathon_plan(cycles, lex, date):
    """50 from each of the marathon's own cycles, 7s then 8s."""
    counts = json.loads(lex.lengthCounts)
    questions = Questions()
    moves = []
    for cycle, length in zip(cycles, MARATHON_LENGTHS):
        filled, steps = walk_cycle(
            cycle, lex, length, counts[str(length)], NUM_QUESTIONS, set()
        )
        questions.extend(filled)
        moves.append(CycleMove(cycle, steps))
    return SchedulePlan(questions, moves, date=date)


def pool_plan(cycle, pool, date, num_questions=NUM_QUESTIONS):
    """
    The next stretch of a cycle over a set of bingos. A set that differs from
    the one the cycle was walking starts a fresh pass in a fresh order.
    """
    # A fixed order, so a position means the same bingo from day to day.
    # (Unexpanded search results carry no probability to sort by.)
    bingos = sorted(
        pool.questions_array(),
        key=lambda q: (len(q.alphagram.alphagram), q.alphagram.alphagram),
    )
    if not bingos:
        return None
    pool_hash = hashlib.blake2b(
        "\n".join(q.alphagram.alphagram for q in bingos).encode(), digest_size=8
    ).hexdigest()
    if pool_hash == cycle.pool_hash:
        seed, cursor, restart_seed = cycle.seed, cycle.cursor, None
    else:
        seed, cursor = new_seed(), 0
        restart_seed = seed
    chosen, steps = walk(
        seed,
        cursor,
        len(bingos),
        num_questions,
        lambda idx: [bingos[i] for i in idx],
        set(),
    )
    chosen.shuffle()
    return SchedulePlan(
        chosen, [CycleMove(cycle, steps, restart_seed, pool_hash)], date=date
    )


def easy_partners(lex, word_length, n, count, taken):
    """`count` random alphagrams from the easier half of the difficulty scale."""
    # About half of all alphagrams qualify, so a few times `count` random
    # probabilities is plenty to filter from.
    sample = random.sample(range(1, n + 1), min(n, 10 * count + 20))
    qs = word_search(
        [
            SearchDescription.lexicon(lex),
            SearchDescription.length(word_length, word_length),
            SearchDescription.difficulty_range(1, EASY_MAX_DIFFICULTY),
            # The word server wants a list condition last.
            SearchDescription.probability_list(sample),
        ]
    )
    candidates = [q for q in qs.questions_array() if q.alphagram.alphagram not in taken]
    random.shuffle(candidates)
    return candidates[:count]


def pass_permutation(seed, pass_no, n):
    """
    The shuffle for one pass through the cycle. Each pass gets its own, so a
    second pass doesn't hand out the same runs of questions as the first.
    """
    digest = hashlib.blake2b(
        struct.pack("<QQ", seed & 0xFFFFFFFFFFFFFFFF, pass_no), digest_size=8
    ).digest()
    return WallPermutation(struct.unpack("<Q", digest)[0] >> 1, n)


def walk(seed, cursor, n, count, fetch, taken):
    """
    The next `count` items of a cycle over n positions, skipping alphagrams
    already in `taken`. fetch(indices) returns the questions at those 0-based
    positions of the underlying list. Returns (Questions, steps consumed).
    """
    out = Questions()
    steps = 0
    while len(out) < count and steps < n:
        pass_no, pos = divmod(cursor + steps, n)
        # Stop at the end of a pass; the next one is a different shuffle.
        want = min(count - len(out), n - steps, n - pos)
        perm = pass_permutation(seed, pass_no, n)
        idx = [perm.forward(pos + i) for i in range(want)]
        steps += want
        for q in fetch(idx):
            if q.alphagram.alphagram not in taken:
                out.append(q)
                taken.add(q.alphagram.alphagram)
    return out, steps


def walk_cycle(cycle, lex, word_length, n, count, taken):
    """The next `count` alphagrams of a whole-length cycle."""
    return walk(
        cycle.seed,
        cycle.cursor,
        n,
        count,
        lambda idx: questions_from_probability_list(
            lex, [i + 1 for i in idx], word_length
        ).questions_array(),
        taken,
    )
