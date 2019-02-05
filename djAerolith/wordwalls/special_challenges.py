import logging
import random

from lib.domain import Questions
from lib.word_db_helper import WordDB, word_search
from lib.word_searches import SearchDescription

logger = logging.getLogger(__name__)
HIGH_PROB_CUTOFF = 5000
MED_PROB_CUTOFF = 10000


class SpecialChallengeTypes:
    HIGH_PROB_BINGOS = 'High-Probability Bingos'
    HIGH_PROB_7s = 'High-Probability 7s'
    HIGH_PROB_8s = 'High-Probability 8s'
    MED_PROB_BINGOS = 'Medium-Probability Bingos'
    COMMON_WORDS_SHORT = 'Common Words (Short)'
    COMMON_WORDS_LONG = 'Common Words (Long)'
    HIGH_VOWEL_BINGOS = 'Vowelly Bingos'
    JQXZ_SHORT_WORDS = 'JQXZ short words'
    SINGLE_ANAGRAM_7s = 'Single-Anagram 7s'
    SINGLE_ANAGRAM_8s = 'Single-Anagram 8s'
    DOUBLE_ANAGRAM_BINGOS = 'Two-Anagram Bingos'
    HIGH_FIVES = 'High Fives'
    HIGH_SIXES = 'High Sixes'
    NEW_IN_LATEST_UPDATE = 'New to Latest Update (2-8)'
    BABY_BLANKS = 'Baby\'s Blank Bingos'


def get_alphagrams_for_challenge(lex, challenge_name):
    """
    get_alphagrams_for_challenge basically creates the special challenge
    given the challenge name.

    """
    # try:
    #     COMMON_SHORT_NAMED_LIST = NamedList.objects.get(
    #         name=FRIENDLY_COMMON_SHORT)
    #     COMMON_LONG_NAMED_LIST = NamedList.objects.get(name=FRIENDLY_COMMON_LONG)
    # except NamedList.DoesNotExist:
    #     COMMON_SHORT_NAMED_LIST = None
    #     COMMON_LONG_NAMED_LIST = None

    db = WordDB(lex.lexiconName)
    func_table = {
        SpecialChallengeTypes.HIGH_PROB_BINGOS: lambda: get_by_prob(
            db, [7, 8], [1, HIGH_PROB_CUTOFF]),
        SpecialChallengeTypes.HIGH_PROB_7s: lambda: get_by_prob(
            db, [7], [1, HIGH_PROB_CUTOFF]),
        SpecialChallengeTypes.HIGH_PROB_8s: lambda: get_by_prob(
            db, [8], [1, HIGH_PROB_CUTOFF]),
        SpecialChallengeTypes.MED_PROB_BINGOS: lambda: get_by_prob(
            db, [7, 8], [HIGH_PROB_CUTOFF + 1, MED_PROB_CUTOFF]),
        # SpecialChallengeTypes.COMMON_WORDS_SHORT: lambda:
        # SpecialChallengeTypes.COMMON_WORDS_LONG: lambda:
        SpecialChallengeTypes.HIGH_VOWEL_BINGOS: lambda: get_by_vowels(
            lex, [7, 8], [4, 5]),
        SpecialChallengeTypes.JQXZ_SHORT_WORDS: lambda: get_by_jqxz(
            lex, [5, 6]),
    }

    fn = func_table[challenge_name]
    return fn()


def get_by_prob(db, lengths, probs):
    """
    get_by_prob returns 50 alphagrams in between lengths and probs.
    It tries to distribute these equally lengthwise.

    """
    questions = Questions()
    for lg in lengths:
        prob_list = list(range(probs[0], probs[1] + 1))
        random.shuffle(prob_list)
        num_qs = int(50 / len(lengths))
        qs = db.get_questions_for_probability_list(prob_list[:num_qs], lg)
        questions.extend(qs)

    return questions


def get_by_vowels(lex, lengths, vowels):
    """
    get_by_vowels returns 50 alphagrams.

    Half of them have length lengths[0] and vowels vowels[0]+
    Half of them have length lengths[1] and vowels vowels[1]+

    """
    questions = Questions()
    for idx, lg in enumerate(lengths):
        qs = word_search([
            SearchDescription.lexicon(lex),
            SearchDescription.length(lg, lg),
            SearchDescription.number_vowels(vowels[idx], lg),
        ])

        qs.shuffle()
        num_qs = int(50 / len(lengths))
        qs.truncate(num_qs)
        questions.extend(qs)

    return questions


def get_by_jqxz(lex, lengths):
    questions = Questions()
    for idx, lg in enumerate(lengths):
        qs = word_search([
            SearchDescription.lexicon(lex),
            SearchDescription.length(lg, lg),
            SearchDescription.matching_anagram('[JQXZ]+' + '?' * (lg - 1)),
        ])

        qs.shuffle()
        num_qs = int(50 / len(lengths))
        qs.truncate(num_qs)
        questions.extend(qs)

    return questions
