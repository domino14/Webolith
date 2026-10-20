"""
Scheduled questions for the live "Today's 7s" / "Today's 8s".

A random draw of 50 a day takes years to reach every alphagram (and new words
in particular), so difficulty data for them never accumulates. When a lexicon
and length have a ChallengeCycle, the live challenge is built instead from:

  1. up to `priority_slots` bingos from the ChallengeQueueItem queue,
  2. one easy partner (difficulty 1-50) per new-word bingo among them, if the
     cycle balances -- new-word bingos are missed ~11 points more often, and a
     partner from the easier half cancels that out,
  3. the next stretch of a seeded permutation of every alphagram of that
     length, so the rest of the quiz still looks random but each alphagram
     comes up exactly once per pass.

Past-date replays stay random: they draw about one player each, which is no
data to speak of.

Nothing is written while planning. The caller saves the DailyChallenge and then
calls plan.commit(), so if two requests race to create the same challenge only
the one whose row saved advances the cursor and the queue.
"""

import json
import logging
import random
import re
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
from wordwalls.infinite_perm import WallPermutation
from wordwalls.models import ChallengeCycle, ChallengeQueueItem

logger = logging.getLogger(__name__)

NUM_QUESTIONS = 50
# A queued bingo waits this long between asks, so its asks come from different
# days' players rather than the same crowd twice.
MIN_DAYS_BETWEEN_ASKS = 7
EASY_MAX_DIFFICULTY = 50


class SchedulePlan:
    def __init__(self, questions, cycle, cycle_steps, asked_ids, gone_ids, date):
        self.questions = questions
        self.cycle = cycle
        self.cycle_steps = cycle_steps
        self.asked_ids = asked_ids
        # Queued alphagrams the word server no longer knows; retire them.
        self.gone_ids = gone_ids
        self.date = date

    def commit(self):
        ChallengeCycle.objects.filter(pk=self.cycle.pk).update(
            cursor=F("cursor") + self.cycle_steps
        )
        ChallengeQueueItem.objects.filter(pk__in=self.asked_ids).update(
            asks_remaining=F("asks_remaining") - 1, last_asked=self.date
        )
        ChallengeQueueItem.objects.filter(pk__in=self.gone_ids).update(asks_remaining=0)


def plan_scheduled_challenge(challenge_name, lex, challenge_date):
    """
    A SchedulePlan for a live "Today's Ns" with a ChallengeCycle, else None
    (and the caller falls back to the usual random draw).
    """
    m = re.match("Today's (?P<length>[0-9]+)s", challenge_name.name)
    if not m:
        return None
    if challenge_date != timezone.localtime(timezone.now()).date():
        return None
    word_length = int(m.group("length"))
    try:
        cycle = ChallengeCycle.objects.get(lexicon=lex, word_length=word_length)
    except ChallengeCycle.DoesNotExist:
        return None
    try:
        return build_plan(cycle, lex, word_length, challenge_date)
    except WDBError:
        logger.exception("[event=scheduled-challenge-error]")
        return None


def build_plan(cycle, lex, word_length, date, num_questions=NUM_QUESTIONS):
    n = json.loads(lex.lengthCounts)[str(word_length)]
    chosen = Questions()
    taken = set()

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
    # A queued bingo that came up anyway (as a partner or in the cycle) has
    # been asked all the same.
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
    return SchedulePlan(chosen, cycle, steps, asked_ids, gone_ids, date)


def easy_partners(lex, word_length, n, count, taken):
    """`count` random alphagrams from the easier half of the difficulty scale."""
    # About half of all alphagrams qualify, so a few times `count` random
    # probabilities is plenty to filter from.
    sample = random.sample(range(1, n + 1), min(n, 10 * count + 20))
    qs = word_search(
        [
            SearchDescription.lexicon(lex),
            SearchDescription.length(word_length, word_length),
            SearchDescription.probability_list(sample),
            SearchDescription.difficulty_range(1, EASY_MAX_DIFFICULTY),
        ]
    )
    candidates = [q for q in qs.questions_array() if q.alphagram.alphagram not in taken]
    random.shuffle(candidates)
    return candidates[:count]


def walk_cycle(cycle, lex, word_length, n, count, taken):
    """
    The next `count` alphagrams of the cycle's permutation, skipping any
    already in the quiz. Returns (questions, permutation steps consumed).
    """
    perm = WallPermutation(cycle.seed, n)
    out = Questions()
    steps = 0
    while len(out) < count and steps < n:
        want = min(count - len(out), n - steps)
        probs = [perm.forward((cycle.cursor + steps + i) % n) + 1 for i in range(want)]
        steps += want
        for q in questions_from_probability_list(
            lex, probs, word_length
        ).questions_array():
            if q.alphagram.alphagram not in taken:
                out.append(q)
                taken.add(q.alphagram.alphagram)
    return out, steps
