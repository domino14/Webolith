import random

from lib.word_db_helper import WordDB
from lib.domain import Questions

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
    db = WordDB(lex.lexiconName)
    if challenge_name == SpecialChallengeTypes.HIGH_PROB_BINGOS:
        return get_by_prob(db, [7, 8], [1, HIGH_PROB_CUTOFF])
    elif challenge_name == SpecialChallengeTypes.HIGH_PROB_7s:
        return get_by_prob(db, [7], [1, HIGH_PROB_CUTOFF])
    elif challenge_name == SpecialChallengeTypes.HIGH_PROB_8s:
        return get_by_prob(db, [8], [1, HIGH_PROB_CUTOFF])
    elif challenge_name == SpecialChallengeTypes.MED_PROB_BINGOS:
        return get_by_prob(db, [7, 8], [HIGH_PROB_CUTOFF + 1,
                                        MED_PROB_CUTOFF])


def get_by_prob(db, lengths, probs):
    """
    get_by_prob returns 50 alphagrams in between lengths and probs.
    It tries to distribute these equally lengthwise.

    """
    questions = Questions()
    for lg in lengths:
        probs = list(range(probs[0], probs[1] + 1))
        random.shuffle(probs)
        num_qs = int(50 / len(lengths))
        qs = db.get_questions_for_probability_list(probs[:num_qs], lg)
        questions.extend(qs)

    return questions
