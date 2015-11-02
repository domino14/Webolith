"""
Helper functions for generating challenges.

"""
from base.models import alphagrammize
from wordwalls.models import (DailyChallengeName, NamedList, DailyChallenge,
                              DailyChallengeMissedBingos,
                              DailyChallengeLeaderboard,
                              DailyChallengeLeaderboardEntry)
import json
from datetime import timedelta
import random
import os
from lib.word_db_helper import WordDB
import re
import logging
logger = logging.getLogger(__name__)
from wordwalls.management.commands.genNamedLists import (FRIENDLY_COMMON_SHORT,
                                                         FRIENDLY_COMMON_LONG)
try:
    COMMON_SHORT_NAMED_LIST = NamedList.objects.get(name=FRIENDLY_COMMON_SHORT)
    COMMON_LONG_NAMED_LIST = NamedList.objects.get(name=FRIENDLY_COMMON_LONG)
except NamedList.DoesNotExist:
    COMMON_SHORT_NAMED_LIST = None
    COMMON_LONG_NAMED_LIST = None


def generate_dc_questions(challenge_name, lex, challenge_date):
    """
    Generate the questions for a daily challenge.
    Returns:
        A tuple (questions, time_secs)
        questions is an array of `question`, which looks like:
            {'q': 'ABC', 'a': ['CAB', ...]}

    """
    db = WordDB(lex.lexiconName)
    # capture number. first try to match to today's lists
    m = re.match("Today's (?P<length>[0-9]+)s",
                 challenge_name.name)
    if m:
        word_length = int(m.group('length'))
        if word_length < 2 or word_length > 15:
            return None   # someone is trying to break my server >:(
        logger.info('Generating daily challenges %s %d', lex, word_length)
        min_p = 1
        # lengthCounts is a dictionary of strings as keys
        max_p = json.loads(lex.lengthCounts)[str(word_length)]
        r = range(min_p, max_p + 1)
        random.shuffle(r)
        # Just the first 50 elements for the daily challenge.
        alphagrams = db.alphagrams_by_probability_list(r[:50], word_length)
        return db.get_alph_words(alphagrams), challenge_name.timeSecs
    # There was no match, check other possible challenge names.
    if challenge_name.name == DailyChallengeName.WEEKS_BINGO_TOUGHIES:
        alphagrams = generate_toughies_challenge(lex, challenge_date)
        random.shuffle(alphagrams)
        return db.get_alph_words(alphagrams), challenge_name.timeSecs
    elif challenge_name.name == DailyChallengeName.BLANK_BINGOS:
        questions = generate_blank_bingos_challenge(lex, challenge_date)
        random.shuffle(questions)
        return questions, challenge_name.timeSecs
    elif challenge_name.name == DailyChallengeName.BINGO_MARATHON:
        alph_words = []
        for lgt in (7, 8):
            min_p = 1
            max_p = json.loads(lex.lengthCounts)[str(lgt)]
            r = range(min_p, max_p + 1)
            random.shuffle(r)
            alph_words += db.get_alph_words(
                db.alphagrams_by_probability_list(r[:50], lgt))
        return alph_words, challenge_name.timeSecs
    elif challenge_name.name in (DailyChallengeName.COMMON_SHORT,
                                 DailyChallengeName.COMMON_LONG):
        questions = generate_common_words_challenge(
            challenge_name.name)
        random.shuffle(questions)
        return questions, challenge_name.timeSecs
    return None


def generate_common_words_challenge(ch_name):
    """Generate the common words challenges. Only for OWL2 right now."""
    if ch_name == DailyChallengeName.COMMON_SHORT:
        pks = json.loads(COMMON_SHORT_NAMED_LIST.questions)
    elif ch_name == DailyChallengeName.COMMON_LONG:
        pks = json.loads(COMMON_LONG_NAMED_LIST.questions)
    random.shuffle(pks)
    return pks[:50]


def generate_blank_bingos_challenge(lex, ch_date):
    """
    Reads the previously generated blank bingo files for lex.
    """
    bingos = []
    for length in (7, 8):
        contents = get_blank_bingos_content(ch_date, length, lex.lexiconName)
        for line in contents.split('\n'):
            line = line.strip()
            if len(line) == 0:
                continue
            qas = line.split()
            words = ' '.join(qas[1:])
            bingos.append({'q': alphagrammize(qas[0]), 'a': words.split()})
    return bingos


def get_blank_bingos_content(challenge_date, length, lexicon_name):
    filename = challenge_date.strftime("%Y-%m-%d") + "-%s-%ss.txt" % (
        lexicon_name, length)
    path = os.path.join(os.getenv("HOME"), 'blanks', filename)
    f = open(path, 'rb')
    contents = f.read()
    f.close()
    return contents


def gen_toughies_by_challenge(challenge_name, num, min_date, max_date, lex):
    """
    Generate a list of toughies given a challenge name. We only store info
    about 7s and 8s now so it would only give us those...

    """
    # Find all challenges matching these parameters
    challenges = DailyChallenge.objects.filter(lexicon=lex).filter(
        date__range=(min_date, max_date)).filter(name=challenge_name)
    # And the missed bingos...
    mbs = DailyChallengeMissedBingos.objects.filter(
        challenge__in=list(challenges))
    num_solved = {}

    # How many people did each challenge? Store this to avoid looking it
    # up.
    for dc in challenges:
        try:
            lb = DailyChallengeLeaderboard.objects.get(challenge=dc)
            entries = DailyChallengeLeaderboardEntry.objects.filter(
                board=lb, qualifyForAward=True)
            num_solved[dc] = len(entries)
        except DailyChallengeLeaderboard.DoesNotExist:
            # This should not happen.
            num_solved[dc] = 1e6
    mb_dict = {}
    # Now sort by percentage missed.
    for b in mbs:
        perc_correct = float(b.numTimesMissed) / num_solved[b.challenge]
        alphagram = get_alphagram_for_dcmb(b)
        if alphagram in mb_dict:
            if perc_correct > mb_dict[alphagram][1]:
                mb_dict[alphagram] = alphagram, perc_correct
        else:
            mb_dict[alphagram] = alphagram, perc_correct
    # Sort by difficulty in reverse order (most difficult first)
    alphs = sorted(mb_dict.items(), key=lambda x: x[1][1], reverse=True)[:num]
    # And just return the alphagram portion.
    return [a[0] for a in alphs]


def get_alphagram_for_dcmb(mb):
    """
    Get an alphagram string, given a DailyChallengeMissedBingos object.
    Handle both cases: `alphagram` and `alphagram_string` columns.
    XXX: This function needs to be rewritten once we remove the
    `alphagram` column.

    """
    if mb.alphagram is None:
        return mb.alphagram_string
    return mb.alphagram.alphagram


def generate_toughies_challenge(lexicon, requested_date):
    challenge_date = toughies_challenge_date(requested_date)
    logger.debug('Creating toughies challenge for date: %s, chdate: %s',
                 requested_date, challenge_date)
    min_date = challenge_date - timedelta(days=7)
    max_date = challenge_date - timedelta(days=1)
    logger.debug('Generating toughies challenge for date range: %s to %s',
                 min_date, max_date)
    alphagrams = gen_toughies_by_challenge(
        DailyChallengeName.objects.get(name="Today's 7s"), 25, min_date,
        max_date, lexicon)
    alphagrams.extend(gen_toughies_by_challenge(
        DailyChallengeName.objects.get(name="Today's 8s"), 25, min_date,
        max_date, lexicon))
    return alphagrams


def toughies_challenge_date(req_date):
    """
    Generates a toughies challenge date given a request date. Basically,
    the closest Tuesday going backwards (depends on a constant).

    """
    diff = (req_date.isoweekday() -
            DailyChallengeName.WEEKS_BINGO_TOUGHIES_ISOWEEKDAY)
    if diff < 0:
        diff = 7 - abs(diff)
    challenge_date = req_date - timedelta(days=diff)
    return challenge_date
