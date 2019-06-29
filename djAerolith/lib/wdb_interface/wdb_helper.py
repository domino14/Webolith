from typing import List

from django.conf import settings

from base.models import Lexicon
from lib.domain import Questions
from lib.wdb_interface.exceptions import WDBError
from lib.wdb_interface.word_searches import SearchDescription
from rpc.wordsearcher.searcher_pb2_twirp import (
    QuestionSearcherClient, TwirpException)
import rpc.wordsearcher.searcher_pb2 as pb


def questions_from_alphagrams(lexicon: Lexicon,
                              alphas: List[str],
                              expand: bool = False) -> Questions:
    """
    Given a list of alphagrams, get optionally fully populated questions.

    """
    # build search request
    qs = word_search([
        SearchDescription.lexicon(lexicon),
        SearchDescription.alphagram_list(alphas),
    ], expand)
    return qs


def questions_from_alpha_dicts(lexicon: Lexicon,
                               alphas: List[dict]) -> Questions:
    """
    This has to use the client.expand function.
    alphas looks like:
        [{'q': ..., 'a': [...]}, ...] where everything is a string.
    """
    client = QuestionSearcherClient(settings.WORD_DB_SERVER_ADDRESS)

    sr = pb.SearchResponse()
    sr.lexicon = lexicon.lexiconName
    pbas = []
    for alpha in alphas:
        words = []
        for w in alpha['a']:
            words.append(pb.Word(word=w))

        pba = pb.Alphagram(alphagram=alpha['q'])
        pba.words.extend(words)
        pbas.append(pba)

    sr.alphagrams.extend(pbas)
    try:
        response = client.expand(sr)
    except TwirpException as e:
        raise WDBError(e)
    qs = Questions()
    qs.set_from_pb_alphagrams(response.alphagrams)
    return qs


def questions_from_probability_range(lexicon: Lexicon,
                                     pmin: int, pmax: int, wl: int,
                                     expand: bool = False):
    qs = word_search([
        SearchDescription.lexicon(lexicon),
        SearchDescription.length(wl, wl),
        SearchDescription.probability_range(pmin, pmax),
    ], expand)
    return qs


def questions_from_probability_list(lexicon: Lexicon, plist: List[int],
                                    wl: int, expand: bool = False):
    qs = word_search([
        SearchDescription.lexicon(lexicon),
        SearchDescription.length(wl, wl),
        SearchDescription.probability_list(plist),
    ], expand)
    return qs


def word_search(search_descriptions: List[pb.SearchRequest.SearchParam],
                expand=False) -> Questions:
    client = QuestionSearcherClient(settings.WORD_DB_SERVER_ADDRESS)
    sr = pb.SearchRequest()
    sr.expand = expand
    sr.searchparams.extend(search_descriptions)
    try:
        response = client.search(sr)
    except TwirpException as e:
        raise WDBError(e)
    qs = Questions()
    qs.set_from_pb_alphagrams(response.alphagrams)
    return qs
