"""
Helper functions for dealing with word searches.

"""
import logging

from base.models import Lexicon

logger = logging.getLogger(__name__)


class SearchDescription(object):
    LENGTH = 'length'
    PROB_RANGE = 'probability_range'
    PROB_LIST = 'probability_list'
    PROB_LIMIT = 'probability_limit'
    NUM_ANAGRAMS = 'number_anagrams'
    NUM_VOWELS = 'number_vowels'
    HAS_TAGS = 'has_tags'
    POINT_VALUE = 'point_value'
    MATCHING_ANAGRAM = 'matching_anagram'
    ALPHAGRAM_LIST = 'alphagram_list'
    LEXICON = 'lexicon'
    NOT_IN_LEXICON = 'not_in_lexicon'

    # Must always be the first search description.
    @staticmethod
    def lexicon(lex: Lexicon):
        return {
            "condition": SearchDescription.LEXICON,
            "lexicon": lex,
        }

    @staticmethod
    def length(min_l, max_l):
        return {
            "condition": SearchDescription.LENGTH,
            "min": min_l,
            "max": max_l,
        }

    @staticmethod
    def probability_range(min_p, max_p):
        return {"condition": SearchDescription.PROB_RANGE,
                "min": min_p, "max": max_p}

    @staticmethod
    def probability_limit(min_p, max_p):
        return {"condition": SearchDescription.PROB_LIMIT,
                "min": min_p, "max": max_p}

    @staticmethod
    def probability_list(p_list):
        return {"condition": SearchDescription.PROB_LIST,
                "p_list": p_list}

    @staticmethod
    def alphagram_list(a_list):
        return {"condition": SearchDescription.ALPHAGRAM_LIST,
                "a_list": a_list}

    @staticmethod
    def number_anagrams(min_n, max_n):
        """
        Gets only words with a certain number of anagrams, gte some
        number and/or lte another number.

        """
        return {
            "condition": SearchDescription.NUM_ANAGRAMS,
            "min": min_n, "max": max_n,
        }

    @staticmethod
    def number_vowels(min_n, max_n):
        """
        Gets only words with a certain number of vowels, gte some
        number and/or lte another number.

        """
        return {
            "condition": SearchDescription.NUM_VOWELS,
            "min": min_n, "max": max_n,
        }

    @staticmethod
    def tags(tag_list, user):
        """
        Only for tagged words.

        """
        return {
            "condition": SearchDescription.HAS_TAGS,
            "user": user,
            "tags": tag_list
        }

    @staticmethod
    def points(min_n, max_n):
        """
        Return only words that have certain point values.

        """
        return {
            "condition": SearchDescription.POINT_VALUE,
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

    @staticmethod
    def not_in_lexicon(lex: str):
        return {
            'condition': SearchDescription.NOT_IN_LEXICON,
            'lexicon': lex,
        }


def temporary_list_name(search_descriptions, lexicon_name):
    """ Build up a temporary list name given a search description. """
    tokens = []
    for sd in search_descriptions:
        if sd['condition'] == SearchDescription.LEXICON:
            tokens.append(sd['lexicon'].lexiconName)
        elif sd['condition'] == SearchDescription.LENGTH:
            if sd['min'] == sd['max']:
                tokens.append(f'{sd["min"]}s')
            elif sd['min'] < sd['max']:
                tk = []
                for i in range(sd['min'], sd['max'] + 1):
                    tk.append(f'{i}s')
                tokens.append(', '.join(tk))
            else:
                tokens.append('INVALID')
        elif sd['condition'] == SearchDescription.PROB_RANGE:
            tokens.append(f'({sd["min"]} - {sd["max"]})')
        elif sd['condition'] == SearchDescription.NUM_ANAGRAMS:
            if sd['min'] == 1 and sd['max'] == 1:
                tokens.append('Single-anagram')
            else:
                tokens.append(f'#-anagrams: {sd["min"]} - {sd["max"]}')
        elif sd['condition'] == SearchDescription.POINT_VALUE:
            if sd['min'] == sd['max']:
                tokens.append(f'{sd["min"]}-pt')
            else:
                tokens.append(f'pts: {sd["min"]} - {sd["max"]}')
        elif sd['condition'] == SearchDescription.NUM_VOWELS:
            if sd['min'] == sd['max']:
                tokens.append(f'{sd["min"]}-vowel')
            else:
                tokens.append(f'vowels: {sd["min"]} - {sd["max"]}')
        elif sd['condition'] == SearchDescription.HAS_TAGS:
            tokens.append(f'tags: {", ".join(sd["tags"])}')
        elif sd['condition'] == SearchDescription.PROB_LIMIT:
            tokens.append(f'(limit {sd["min"]} - {sd["max"]})')
        elif sd['condition'] == SearchDescription.NOT_IN_LEXICON:
            desc = ''
            if sd['lexicon'] == 'other_english':
                if lexicon_name == 'America':
                    desc = 'CSW15'
                elif lexicon_name == 'CSW15':
                    desc = 'America'
            elif sd['lexicon'] == 'update':
                if lexicon_name == 'America':
                    desc = 'OWL2'
                elif lexicon_name == 'CSW15':
                    desc = 'CSW12'
            tokens.append(f'not in {desc}')
    return ' '.join(tokens)
