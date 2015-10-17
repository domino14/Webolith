"""
Helper functions for dealing with word searches.

"""
from lib.word_db_helper import WordDB
import logging
logger = logging.getLogger(__name__)


class SearchDescription(object):
    @staticmethod
    def probability_range(min_p, max_p, length, lex):
        return {"condition": "probability_range",
                "length": length,
                "min": min_p, "max": max_p,
                "lexicon": lex}

    @staticmethod
    def probabilities(p_list, length, lex):
        return {"condition": "probabilities",
                "length": length,
                "lexicon": lex}


def alphagrams_array(search_description):
    """
    Gets an array of alphagrams in format:

    [{
        "q": "ACDEF", "a": ["DECAF", "FACED"]
    }, ...]

    """
    db = WordDB(search_description['lexicon'].lexiconName)

    if search_description['condition'] == 'probability_range':
        return alphagrams_for_prob_range(db, search_description['min'],
                                         search_description['max'],
                                         search_description['length'])


def alphagrams_for_prob_range(db, min_p, max_p, length):
    alphagrams = db.alphagrams_by_probability_range(min_p, max_p, length)
    return db.get_alph_words(alphagrams)
