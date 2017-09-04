"""
Helper functions for dealing with word searches.

"""
import logging

from base.models import AlphagramTag
from lib.word_db_helper import WordDB, Questions, Alphagram
logger = logging.getLogger(__name__)


class SearchDescription(object):
    PROB_RANGE = 'probability_range'
    NUM_ANAGRAMS = 'number_anagrams'
    HAS_TAGS = 'has_tags'
    PROB_LIMIT = 'probability_limit'
    POINT_VALUES = 'point_values'
    MATCHING_ANAGRAM = 'matching_anagram'

    @staticmethod
    def probability_range(min_p, max_p, length, lex):
        return {"condition": SearchDescription.PROB_RANGE,
                "length": length,
                "min": min_p, "max": max_p,
                "lexicon": lex}

    @staticmethod
    def number_anagrams(length, lex, min_n, max_n):
        """
        Gets only words with a certain number of anagrams, gte some
        number and/or lte another number.

        """
        return {
            "condition": SearchDescription.NUM_ANAGRAMS,
            "length": length,
            "min": min_n, "max": max_n,
            "lexicon": lex
        }

    @staticmethod
    def tags(length, lex, tag_list, user):
        """
        Only for tagged words.

        """
        return {
            "condition": SearchDescription.HAS_TAGS,
            "length": length,
            "lexicon": lex,
            "user": user,
            "tags": tag_list
        }

    @staticmethod
    def limit_probability(length, lex, min_n, max_n):
        """
        Meant to be applied as the last filter. It limits the number
        of alphagrams given to a player to the [min_n, max_n] range,
        by probability.
        For example if we have 10 results and we apply [3, 7] we would
        only give results 3 through 7 by probability (more probable first).

        """
        return {
            "condition": SearchDescription.PROB_LIMIT,
            "length": length,
            "lexicon": lex,
            "min":  min_n, "max": max_n
        }

    @staticmethod
    def points(length, lex, min_n, max_n):
        """
        Return only words that have certain point values.

        """
        return {
            "condition": SearchDescription.POINT_VALUES,
            "length": length,
            "lexicon": lex,
            "min": min_n, "max": max_n
        }

    @staticmethod
    def matching_anagram(length, lex, letters):
        """
        Mostly meant for stem study, etc. Letters can be something like
        AEINST?

        """
        return {
            "condition": SearchDescription.MATCHING_ANAGRAM,
            "length": length,
            "lexicon": lex,
            "letters": letters
        }


def word_search(search_descriptions):
    """
    search_descriptions is an array of search descriptions to be applied
    in order from left to right. Order usually shouldn't matter except
    for the final limit_probability clause, or as a small optimization.

    Gets an array of alphagrams in format:

    [{
        "q": "ACDEF", "a": ["DECAF", "FACED"]
    }, ...]

    """

    db = WordDB(search_descriptions[0]['lexicon'].lexiconName)

    # If the very first description is probability_range, we can query
    # the database directly for it. Otherwise, we should get all alphagrams
    # for that length from the database and manually apply the probability
    # range filter later if it exists.
    # XXX: Build a query generator ;)

    sd = search_descriptions[0]
    if sd['condition'] == SearchDescription.PROB_RANGE:
        qs = questions_for_prob_range(db, sd['min'], sd['max'], sd['length'])
        start_idx = 1
    else:
        qs = questions_for_prob_range(db, 1, 200000, sd['length'])
        start_idx = 0

    for idx, sd in enumerate(search_descriptions[start_idx:]):
        if sd['condition'] == SearchDescription.NUM_ANAGRAMS:
            new_qs = Questions()
            for q in qs.questions_array():
                n_words = len(q.answers)
                if n_words >= sd['min'] and n_words <= sd['max']:
                    new_qs.append(q)
            qs = new_qs
        elif sd['condition'] == SearchDescription.POINT_VALUES:
            new_qs = Questions()
            for q in qs.questions_array():
                pts = calculate_pts(q.alphagram.alphagram, sd['lexicon'])
                if pts >= sd['min'] and pts <= sd['max']:
                    new_qs.append(q)
            qs = new_qs
        elif sd['condition'] == SearchDescription.PROB_LIMIT:
            new_qs = Questions()
            qs.sort_by_probability()
            new_qs.questions = qs.questions[sd['min']-1:sd['max']]
            qs = new_qs
        elif sd['condition'] == SearchDescription.HAS_TAGS:
            new_q_list = []
            tagged = AlphagramTag.objects.filter(user=sd['user'],
                                                 lexicon=sd['lexicon'],
                                                 tag__in=sd['tags'])
            # Only quiz on tagged words that are already in the matched
            # list.
            if tagged.count() == 0:
                qs = Questions()  # Essentially clearing out the questions.
                continue
            # Otherwise, let's possibly make a set of questions.
            look_in_set = True
            a_set = set()
            if start_idx == 0 and idx == 0:
                # In this case, there is no filtering applied prior to this,
                # so no need to look in a set.
                look_in_set = False
            else:
                for q in qs.question_array():
                    a_set.add(q.alphagram)
            for t in tagged:
                if (look_in_set and t.alphagram in a_set) or (not look_in_set):
                    new_q_list.append(Alphagram(t.alphagram))
            qs = db.get_questions(new_q_list)

    return qs


def calculate_pts(alpha, lex):
    letter_pt_map = {
        'A': 1, 'B': 3, 'C': 3, 'D': 2, 'E': 1, 'F': 4, 'G': 2, 'H': 4,
        'I': 1, 'J': 8, 'K': 5, 'L': 1, 'M': 3, 'N': 1, 'O': 1, 'P': 3,
        'Q': 10, 'R': 1, 'S': 1, 'T': 1, 'U': 1, 'V': 4, 'W': 4, 'X': 8,
        'Y': 4, 'Z': 10
    }

    pts = 0
    if lex.lexiconName in ('OWL2', 'America', 'America2016'):
        for letter in alpha:
            pts += letter_pt_map[letter]
    else:
        raise NotImplementedError('Not implemented for this lexicon')
    return pts


def questions_for_prob_range(db, min_p, max_p, length):
    alphagrams = db.alphagrams_by_probability_range(min_p, max_p, length)
    return db.get_questions(alphagrams)
