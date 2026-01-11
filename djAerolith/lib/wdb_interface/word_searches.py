import logging
from typing import List

from base.models import Lexicon, AlphagramTag, User

import rpc.wordsearcher.searcher_pb2 as pb

logger = logging.getLogger(__name__)


class SearchDescription(object):
    @staticmethod
    def lexicon(lex: Lexicon) -> pb.SearchRequest.SearchParam:
        return pb.SearchRequest.SearchParam(
            condition=pb.SearchRequest.Condition.LEXICON,
            stringvalue=pb.SearchRequest.StringValue(value=lex.lexiconName),
        )

    @staticmethod
    def length(min_l: int, max_l: int) -> pb.SearchRequest.SearchParam:
        return pb.SearchRequest.SearchParam(
            condition=pb.SearchRequest.Condition.LENGTH,
            minmax=pb.SearchRequest.MinMax(min=min_l, max=max_l),
        )

    @staticmethod
    def probability_range(
        min_p: int, max_p: int
    ) -> pb.SearchRequest.SearchParam:  # noqa
        return pb.SearchRequest.SearchParam(
            condition=pb.SearchRequest.Condition.PROBABILITY_RANGE,
            minmax=pb.SearchRequest.MinMax(min=min_p, max=max_p),
        )

    @staticmethod
    def probability_limit(
        min_p: int, max_p: int
    ) -> pb.SearchRequest.SearchParam:  # noqa
        return pb.SearchRequest.SearchParam(
            condition=pb.SearchRequest.Condition.PROBABILITY_LIMIT,
            minmax=pb.SearchRequest.MinMax(min=min_p, max=max_p),
        )

    @staticmethod
    def number_of_anagrams(
        min_n: int, max_n: int
    ) -> pb.SearchRequest.SearchParam:  # noqa
        return pb.SearchRequest.SearchParam(
            condition=pb.SearchRequest.Condition.NUMBER_OF_ANAGRAMS,
            minmax=pb.SearchRequest.MinMax(min=min_n, max=max_n),
        )

    @staticmethod
    def number_of_vowels(
        min_n: int, max_n: int
    ) -> pb.SearchRequest.SearchParam:  # noqa
        return pb.SearchRequest.SearchParam(
            condition=pb.SearchRequest.Condition.NUMBER_OF_VOWELS,
            minmax=pb.SearchRequest.MinMax(min=min_n, max=max_n),
        )

    @staticmethod
    def point_value(min_n: int, max_n: int) -> pb.SearchRequest.SearchParam:  # noqa
        return pb.SearchRequest.SearchParam(
            condition=pb.SearchRequest.Condition.POINT_VALUE,
            minmax=pb.SearchRequest.MinMax(min=min_n, max=max_n),
        )

    @staticmethod
    def matching_anagram(letters: str) -> pb.SearchRequest.SearchParam:
        return pb.SearchRequest.SearchParam(
            condition=pb.SearchRequest.Condition.MATCHING_ANAGRAM,
            stringvalue=pb.SearchRequest.StringValue(value=letters),
        )

    @staticmethod
    def alphagram_list(alphas: List[str]) -> pb.SearchRequest.SearchParam:
        return pb.SearchRequest.SearchParam(
            condition=pb.SearchRequest.Condition.ALPHAGRAM_LIST,
            stringarray=pb.SearchRequest.StringArray(values=alphas),
        )

    @staticmethod
    def probability_list(ps: List[int]) -> pb.SearchRequest.SearchParam:
        return pb.SearchRequest.SearchParam(
            condition=pb.SearchRequest.Condition.PROBABILITY_LIST,
            numberarray=pb.SearchRequest.NumberArray(values=ps),
        )

    @staticmethod
    def not_in_lexicon(descriptor: str) -> pb.SearchRequest.SearchParam:
        if descriptor == "other_english":
            pb_val = pb.SearchRequest.NotInLexCondition.OTHER_ENGLISH
        elif descriptor == "update":
            pb_val = pb.SearchRequest.NotInLexCondition.PREVIOUS_VERSION
        return pb.SearchRequest.SearchParam(
            condition=pb.SearchRequest.Condition.NOT_IN_LEXICON,
            numbervalue=pb.SearchRequest.NumberValue(value=pb_val),
        )

    @staticmethod
    def has_tags(
        tags: List[str], user: User, lexicon: Lexicon
    ) -> pb.SearchRequest.SearchParam:
        alphas = get_tagged_alphagrams(tags, user, lexicon)
        return SearchDescription.alphagram_list(alphas)

    @staticmethod
    def difficulty_range(min_d: int, max_d: int) -> pb.SearchRequest.SearchParam:
        return pb.SearchRequest.SearchParam(
            condition=pb.SearchRequest.Condition.DIFFICULTY_RANGE,
            minmax=pb.SearchRequest.MinMax(min=min_d, max=max_d),
        )

    @staticmethod
    def deleted_word() -> pb.SearchRequest.SearchParam:
        return pb.SearchRequest.SearchParam(
            condition=pb.SearchRequest.Condition.DELETED_WORD
        )

    @staticmethod
    def contains_hooks(
        hook_type: int, hooks: str, not_condition: bool = False
    ) -> pb.SearchRequest.SearchParam:
        return pb.SearchRequest.SearchParam(
            condition=pb.SearchRequest.Condition.CONTAINS_HOOKS,
            hooksparam=pb.SearchRequest.HooksParam(
                hook_type=hook_type, hooks=hooks, not_condition=not_condition
            ),
        )

    @staticmethod
    def definition_contains(text: str) -> pb.SearchRequest.SearchParam:
        return pb.SearchRequest.SearchParam(
            condition=pb.SearchRequest.Condition.DEFINITION_CONTAINS,
            stringvalue=pb.SearchRequest.StringValue(value=text),
        )


def SearchCriterionFn(searchType: int):
    """
    Map the passed-in search enum to a static function in SearchDescription.

    """
    # this uses silly metaprogramming
    name = pb.SearchRequest.Condition.Name(searchType).lower()
    return getattr(SearchDescription, name)


MIN_MAX_DESCRIPTIONS = [
    pb.SearchRequest.Condition.LENGTH,
    pb.SearchRequest.Condition.PROBABILITY_RANGE,
    pb.SearchRequest.Condition.NUMBER_OF_ANAGRAMS,
    pb.SearchRequest.Condition.NUMBER_OF_VOWELS,
    pb.SearchRequest.Condition.POINT_VALUE,
    pb.SearchRequest.Condition.PROBABILITY_LIMIT,
    pb.SearchRequest.Condition.DIFFICULTY_RANGE,
]

TAGS_DESCRIPTION = pb.SearchRequest.Condition.HAS_TAGS

SINGLE_NUMBER_DESCRIPTIONS = [
    pb.SearchRequest.Condition.NOT_IN_LEXICON,
]

SINGLE_STRING_DESCRIPTIONS = [
    pb.SearchRequest.Condition.MATCHING_ANAGRAM,
    pb.SearchRequest.Condition.DEFINITION_CONTAINS,
]

HOOKS_DESCRIPTIONS = [
    pb.SearchRequest.Condition.CONTAINS_HOOKS,
]


def get_tagged_alphagrams(tags: List[str], user: User, lexicon: Lexicon):
    """
    Get a list of all tagged alphagrams matching the above. Use the
    Django ORM; this is not a SQLite-backed database.

    """
    tagged = AlphagramTag.objects.filter(user=user, tag__in=tags, lexicon=lexicon)
    logger.debug(
        f"tags: {tags}, user: {user}, lexicon: {lexicon} "
        f"Found {tagged.count()} tagged alphagrams"
    )
    return [t.alphagram for t in tagged]


def temporary_list_name(
    search_descriptions: List[pb.SearchRequest.SearchParam], lexicon_name: str
) -> str:
    """Build up a temporary list name given a search description."""
    tokens = []
    for sd in search_descriptions:
        if sd.condition == pb.SearchRequest.Condition.LEXICON:
            tokens.append(sd.stringvalue.value)
        elif sd.condition == pb.SearchRequest.Condition.LENGTH:
            if sd.minmax.min == sd.minmax.max:
                tokens.append(f"{sd.minmax.min}s")
            elif sd.minmax.min < sd.minmax.max:
                tk = []
                for i in range(sd.minmax.min, sd.minmax.max + 1):
                    tk.append(f"{i}s")
                tokens.append(", ".join(tk))
            else:
                tokens.append("INVALID")
        elif sd.condition == pb.SearchRequest.Condition.PROBABILITY_RANGE:
            tokens.append(f"({sd.minmax.min} - {sd.minmax.max})")
        elif sd.condition == pb.SearchRequest.Condition.NUMBER_OF_ANAGRAMS:
            if sd.minmax.min == 1 and sd.minmax.max == 1:
                tokens.append("Single-anagram")
            else:
                tokens.append(f"#-anagrams: {sd.minmax.min} - {sd.minmax.max}")
        elif sd.condition == pb.SearchRequest.Condition.POINT_VALUE:
            if sd.minmax.min == sd.minmax.max:
                tokens.append(f"{sd.minmax.min}-pt")
            else:
                tokens.append(f"pts: {sd.minmax.min} - {sd.minmax.max}")
        elif sd.condition == pb.SearchRequest.Condition.NUMBER_OF_VOWELS:
            if sd.minmax.min == sd.minmax.max:
                tokens.append(f"{sd.minmax.min}-vowel")
            else:
                tokens.append(f"vowels: {sd.minmax.min} - {sd.minmax.max}")
        elif sd.condition == pb.SearchRequest.Condition.HAS_TAGS:
            tokens.append(f'tags: {", ".join(sd.tags)}')
        elif sd.condition == pb.SearchRequest.Condition.PROBABILITY_LIMIT:
            tokens.append(f"(limit {sd.minmax.min} - {sd.minmax.max})")
        elif sd.condition == pb.SearchRequest.Condition.NOT_IN_LEXICON:
            desc = ""
            if (
                sd.numbervalue.value == pb.SearchRequest.NotInLexCondition.OTHER_ENGLISH
            ):  # noqa
                if lexicon_name == "NWL23":
                    desc = "CSW24"
                elif lexicon_name == "CSW24":
                    desc = "NWL23"
            elif (
                sd.numbervalue.value
                == pb.SearchRequest.NotInLexCondition.PREVIOUS_VERSION
            ):  # noqa
                if lexicon_name == "NWL23":
                    desc = "NWL20"
                elif lexicon_name == "CSW24":
                    desc = "CSW21"
                elif lexicon_name == "FISE2":
                    desc = "FISE09"
                elif lexicon_name == "OSPS50":
                    desc = "OSPS49"
                elif lexicon_name == "FRA24":
                    desc = "FRA20"
                elif lexicon_name == "RD29":
                    desc = "Deutsch"
            tokens.append(f"not in {desc}")
        elif sd.condition == pb.SearchRequest.Condition.MATCHING_ANAGRAM:
            tokens.append(f"matching {sd.stringvalue.value}")
        elif sd.condition == pb.SearchRequest.Condition.DIFFICULTY_RANGE:
            tokens.append(f"(difficulty {sd.minmax.min} - {sd.minmax.max})")
        elif sd.condition == pb.SearchRequest.Condition.DELETED_WORD:
            tokens.append("deleted words")
        elif sd.condition == pb.SearchRequest.Condition.CONTAINS_HOOKS:
            hook_type_names = ["front", "back", "inner"]
            hook_type_name = (
                hook_type_names[sd.hooksparam.hook_type]
                if sd.hooksparam.hook_type < 3
                else "unknown"
            )
            not_text = "NOT " if sd.hooksparam.not_condition else ""
            tokens.append(f"{not_text}{hook_type_name} hooks: {sd.hooksparam.hooks}")
        elif sd.condition == pb.SearchRequest.Condition.DEFINITION_CONTAINS:
            tokens.append(f'definition contains: "{sd.stringvalue.value}"')
    return " ".join(tokens)
