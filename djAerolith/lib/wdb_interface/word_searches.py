from typing import List

from base.models import Lexicon

import lib.wdb_interface.rpc.searcher_pb2 as pb


class SearchDescription(object):
    @staticmethod
    def lexicon(lex: Lexicon) -> pb.SearchRequest.SearchParam:
        return pb.SearchRequest.SearchParam(
            condition=pb.SearchRequest.Condition.LEXICON,
            stringvalue=pb.SearchRequest.StringValue(value=lex.lexiconName))

    @staticmethod
    def length(min_l: int, max_l: int) -> pb.SearchRequest.SearchParam:
        return pb.SearchRequest.SearchParam(
            condition=pb.SearchRequest.Condition.LENGTH,
            minmax=pb.SearchRequest.MinMax(min=min_l, max=max_l))

    @staticmethod
    def probability_range(min_p: int, max_p: int) -> pb.SearchRequest.SearchParam:  # noqa
        return pb.SearchRequest.SearchParam(
            condition=pb.SearchRequest.Condition.PROBABILITY_RANGE,
            minmax=pb.SearchRequest.MinMax(min=min_p, max=max_p))

    @staticmethod
    def probability_limit(min_p: int, max_p: int) -> pb.SearchRequest.SearchParam:  # noqa
        return pb.SearchRequest.SearchParam(
            condition=pb.SearchRequest.Condition.PROBABILITY_LIMIT,
            minmax=pb.SearchRequest.MinMax(min=min_p, max=max_p))

    @staticmethod
    def number_anagrams(min_n: int, max_n: int) -> pb.SearchRequest.SearchParam:  # noqa
        return pb.SearchRequest.SearchParam(
            condition=pb.SearchRequest.Condition.NUMBER_OF_ANAGRAMS,
            minmax=pb.SearchRequest.MinMax(min=min_n, max=max_n))

    @staticmethod
    def number_vowels(min_n: int, max_n: int) -> pb.SearchRequest.SearchParam:  # noqa
        return pb.SearchRequest.SearchParam(
            condition=pb.SearchRequest.Condition.NUMBER_OF_VOWELS,
            minmax=pb.SearchRequest.MinMax(min=min_n, max=max_n))

    @staticmethod
    def point_value(min_n: int, max_n: int) -> pb.SearchRequest.SearchParam:  # noqa
        return pb.SearchRequest.SearchParam(
            condition=pb.SearchRequest.Condition.POINT_VALUE,
            minmax=pb.SearchRequest.MinMax(min=min_n, max=max_n))

    @staticmethod
    def matching_anagram(letters: str) -> pb.SearchRequest.SearchParam:
        return pb.SearchRequest.SearchParam(
            condition=pb.SearchRequest.Condition.MATCHING_ANAGRAM,
            stringvalue=pb.SearchRequest.StringValue(value=letters))

    @staticmethod
    def alphagram_list(alphas: List[str]) -> pb.SearchRequest.SearchParam:
        return pb.SearchRequest.SearchParam(
            condition=pb.SearchRequest.Condition.ALPHAGRAM_LIST,
            stringarray=pb.SearchRequest.StringArray(values=alphas))

    @staticmethod
    def probability_list(ps: List[int]) -> pb.SearchRequest.SearchParam:
        return pb.SearchRequest.SearchParam(
            condition=pb.SearchRequest.Condition.PROBABILITY_LIST,
            numberarray=pb.SearchRequest.NumberArray(values=ps))

    @staticmethod
    def not_in_lexicon(descriptor: str) -> pb.SearchRequest.SearchParam:
        if descriptor == 'other_english':
            pb_val = pb.SearchRequest.NotInLexCondition.OTHER_ENGLISH
        elif descriptor == 'update':
            pb_val = pb.SearchRequest.NotInLexCondition.PREVIOUS_VERSION
        return pb.SearchRequest.SearchParam(
            condition=pb.SearchRequest.Condition.NOT_IN_LEXICON,
            numbervalue=pb.SearchRequest.NumberValue(value=pb_val))
