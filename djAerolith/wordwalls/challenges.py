"""
Helper functions for generating challenges.

"""

import json
from datetime import timedelta
import random
import re
import logging

from wordwalls.models import (
    DailyChallengeName,
    DailyChallenge,
    DailyChallengeMissedBingos,
    DailyChallengeLeaderboard,
    DailyChallengeLeaderboardEntry,
)
from lib.domain import Question, Questions, Alphagram
from lib.wdb_interface.anagrammer import (
    gen_blank_challenges,
    gen_build_challenge,
    WDBError,
)
from lib.wdb_interface.wdb_helper import (
    questions_from_probability_list,
    questions_from_alphagrams,
    word_search,
)
from lib.wdb_interface.word_searches import SearchDescription

logger = logging.getLogger(__name__)


def generate_dc_questions(challenge_name, lex, challenge_date):
    """
    Generate the questions for a daily challenge.
    Returns:
        A tuple (questions, time_secs)
        questions is of type Questions

    """
    logger.info(
        "Trying to create challenge {} for {} ({})".format(
            challenge_name, lex, challenge_date
        )
    )
    # capture number. first try to match to today's lists
    m = re.match("Today's (?P<length>[0-9]+)s", challenge_name.name)
    if m:
        word_length = int(m.group("length"))
        if word_length < 2 or word_length > 15:
            return None  # someone is trying to break my server >:(
        logger.info("Generating daily challenges %s %d", lex, word_length)
        min_p = 1
        # lengthCounts is a dictionary of strings as keys
        try:
            max_p = json.loads(lex.lengthCounts)[str(word_length)]
        except KeyError:
            return None
        r = list(range(min_p, max_p + 1))
        random.shuffle(r)
        # Just the first 50 elements for the daily challenge.
        return (
            questions_from_probability_list(lex, r[:50], word_length),
            challenge_name.timeSecs,
        )
    # There was no match, check other possible challenge names.
    if challenge_name.name == DailyChallengeName.WEEKS_BINGO_TOUGHIES:
        alphagrams = generate_toughies_challenge(lex, challenge_date)
        random.shuffle(alphagrams)
        if len(alphagrams) == 0:
            return Questions(), 0
        return (
            questions_from_alphagrams(lex, alphagrams),
            challenge_name.timeSecs,
        )
    elif challenge_name.name == DailyChallengeName.ALLTIME_BINGO_TOUGHIES:
        alphagrams = generate_alltime_toughies_challenge(lex)
        if len(alphagrams) == 0:
            return Questions(), 0
        return (
            questions_from_alphagrams(lex, alphagrams),
            challenge_name.timeSecs,
        )
    elif challenge_name.name == DailyChallengeName.HIGHPROB_TOUGHIES:
        alphagrams = generate_highprob_toughies_challenge(lex)
        if len(alphagrams) == 0:
            return Questions(), 0
        return (
            questions_from_alphagrams(lex, alphagrams),
            challenge_name.timeSecs,
        )
    elif challenge_name.name == DailyChallengeName.BLANK_BINGOS:
        questions = generate_blank_bingos_challenge(lex)
        questions.shuffle()
        return questions, challenge_name.timeSecs
    elif challenge_name.name == DailyChallengeName.BINGO_MARATHON:
        questions = Questions()
        for lgt in (7, 8):
            min_p = 1
            max_p = json.loads(lex.lengthCounts)[str(lgt)]
            r = list(range(min_p, max_p + 1))
            random.shuffle(r)
            questions.extend(questions_from_probability_list(lex, r[:50], lgt))
        return questions, challenge_name.timeSecs
    # elif challenge_name.name in (DailyChallengeName.COMMON_SHORT,
    #                              DailyChallengeName.COMMON_LONG):
    #     questions = generate_common_words_challenge(
    #         challenge_name.name)
    #     random.shuffle(questions)
    #     return questions, challenge_name.timeSecs

    # Try to match to build challenges.
    m = re.match(
        r"Word Builder \((?P<lmin>[0-9]+)-(?P<lmax>[0-9]+)\)",
        challenge_name.name,
    )
    if m:
        lmin = int(m.group("lmin"))
        lmax = int(m.group("lmax"))
        questions = generate_word_builder_challenge(lex, lmin, lmax)
        return questions, challenge_name.timeSecs

    # Nothing matched, we done here.
    return None


# def generate_common_words_challenge(ch_name):
#     """Generate the common words challenges. Only for OWL2 right now."""
#     if ch_name == DailyChallengeName.COMMON_SHORT:
#         pks = json.loads(COMMON_SHORT_NAMED_LIST.questions)
#     elif ch_name == DailyChallengeName.COMMON_LONG:
#         pks = json.loads(COMMON_LONG_NAMED_LIST.questions)
#     random.shuffle(pks)
#     return pks[:50]


def generate_blank_bingos_challenge(lex):
    """
    Contact blank challenges server and generate said challenges.

    """
    bingos = Questions()
    logger.info("in generate_blank_bingos_challenge")
    for length in (7, 8):
        try:
            challs = gen_blank_challenges(length, lex.lexiconName, 2, 25, 5)
        except WDBError:
            logger.exception("[event=wdberror]")
            return bingos
        for chall in challs:
            question = Question(Alphagram(chall["q"]), [])
            question.set_answers_from_word_list(chall["a"])
            bingos.append(question)
    return bingos


def generate_word_builder_challenge(lex, lmin, lmax):
    """Contact builder server and generate builder challenges."""
    # Require the lmax rack to have a word in it some percentage of the time.
    min_sols_mu = 0
    min_sols_sigma = 0
    max_sols_mu = 0
    max_sols_sigma = 0

    if lmax == 6:
        min_sols_mu, min_sols_sigma = 10, 2
        max_sols_mu, max_sols_sigma = 30, 5
        require_word = random.randint(1, 10) > 2  # 80%
    elif lmax == 7:
        min_sols_mu, min_sols_sigma = 15, 3
        max_sols_mu, max_sols_sigma = 50, 6
        require_word = random.randint(1, 10) > 5  # 50%
    elif lmax == 8:
        min_sols_mu, min_sols_sigma = 20, 4
        max_sols_mu, max_sols_sigma = 75, 8
        require_word = random.randint(1, 10) > 7  # 30%

    min_sols = max(int(random.gauss(min_sols_mu, min_sols_sigma)), 1)
    max_sols = min(int(random.gauss(max_sols_mu, max_sols_sigma)), 100)
    min_sols, max_sols = min(min_sols, max_sols), max(min_sols, max_sols)
    logger.info(
        "min_sols: %s, max_sols: %s, require_word: %s",
        min_sols,
        max_sols,
        require_word,
    )
    q_struct = Questions()

    try:
        questions = gen_build_challenge(
            lmin, lmax, lex.lexiconName, require_word, min_sols, max_sols
        )
    except WDBError:
        logger.exception("[event=wdberror]")
        return q_struct
    ret_question = Question(Alphagram(questions[0]["q"]), [])
    ret_question.set_answers_from_word_list(questions[0]["a"])
    q_struct.append(ret_question)
    q_struct.set_build_mode()
    return q_struct


# XXX: This appears to be an expensive function; about 0.75 secs on my
# machine!
def gen_toughies_by_challenge(challenge_name, num, min_date, max_date, lex):
    """
    Generate a list of toughies given a challenge name. We only store info
    about 7s and 8s now so it would only give us those...

    Returns:
        A list of string alphagrams.
    """
    # Find all challenges matching these parameters
    challenges = (
        DailyChallenge.objects.filter(lexicon=lex)
        .filter(date__range=(min_date, max_date))
        .filter(name=challenge_name)
    )
    # And the missed bingos...
    # XXX: Rewrite as a raw SQL query.
    mbs = DailyChallengeMissedBingos.objects.filter(challenge__in=list(challenges))
    num_solved = {}
    logger.debug("Got all relevant challenges and bingos...")
    # How many people did each challenge? Store this to avoid looking it
    # up.
    for dc in challenges:
        try:
            lb = DailyChallengeLeaderboard.objects.get(challenge=dc)
            entries = DailyChallengeLeaderboardEntry.objects.filter(
                board=lb, qualifyForAward=True
            )
            num_solved[dc] = len(entries)
        except DailyChallengeLeaderboard.DoesNotExist:
            # This should not happen.
            num_solved[dc] = 1e6
    logger.debug("Created num_solved dictionary...")
    mb_dict = {}
    # Now sort by percentage missed.
    for b in mbs:
        try:
            perc_correct = float(b.numTimesMissed) / num_solved[b.challenge]
        except ZeroDivisionError:
            continue
        alphagram = b.alphagram_string
        if alphagram in mb_dict:
            if perc_correct > mb_dict[alphagram][1]:
                mb_dict[alphagram] = alphagram, perc_correct
        else:
            mb_dict[alphagram] = alphagram, perc_correct
    # Sort by difficulty in reverse order (most difficult first)
    alphs = sorted(list(mb_dict.items()), key=lambda x: x[1][1], reverse=True)[:num]
    logger.debug("Sorted by difficulty, returning... %s", alphs)
    # And just return the alphagram portion.
    return [a[0] for a in alphs]


def generate_toughies_challenge(lexicon, requested_date):
    challenge_date = toughies_challenge_date(requested_date)
    logger.info(
        "Creating toughies challenge for date: %s, chdate: %s",
        requested_date,
        challenge_date,
    )
    min_date = challenge_date - timedelta(days=7)
    max_date = challenge_date - timedelta(days=1)
    logger.debug(
        "Generating toughies challenge for date range: %s to %s",
        min_date,
        max_date,
    )
    alphagrams = gen_toughies_by_challenge(
        DailyChallengeName.objects.get(name="Today's 7s"),
        25,
        min_date,
        max_date,
        lexicon,
    )
    alphagrams.extend(
        gen_toughies_by_challenge(
            DailyChallengeName.objects.get(name="Today's 8s"),
            25,
            min_date,
            max_date,
            lexicon,
        )
    )
    logger.debug("Generated! %s", alphagrams)
    return alphagrams


def generate_alltime_toughies_challenge(lexicon):
    try:
        qs = word_search(
            [
                SearchDescription.lexicon(lexicon),
                SearchDescription.length(7, 8),
                SearchDescription.difficulty_range(81, 100),  # top 20% hardest bingos
            ]
        )
    except WDBError:
        logger.exception("alltime-toughies-error")
        return []
    qs.shuffle()
    return qs.alphagram_string_list()[:50]


def generate_highprob_toughies_challenge(lexicon):
    try:
        qs = word_search(
            [
                SearchDescription.lexicon(lexicon),
                SearchDescription.length(7, 8),
                SearchDescription.probability_range(1, 10000),
                SearchDescription.difficulty_range(81, 100),  # top 20% hardest bingos
            ]
        )
    except WDBError:
        logger.exception("highprob-toughies-error")
        return []
    qs.shuffle()
    return qs.alphagram_string_list()[:50]


def toughies_challenge_date(req_date):
    """
    Generates a toughies challenge date given a request date. Basically,
    the closest Tuesday going backwards (depends on a constant).

    """
    diff = req_date.isoweekday() - DailyChallengeName.WEEKS_BINGO_TOUGHIES_ISOWEEKDAY
    if diff < 0:
        diff = 7 - abs(diff)
    challenge_date = req_date - timedelta(days=diff)
    return challenge_date
