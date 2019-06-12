from typing import List

from django.conf import settings

from base.models import Lexicon
from lib.domain import Questions
from lib.wdb_interface.word_searches import SearchDescription
from lib.wdb_interface.rpc.searcher_pb2_twirp import (QuestionSearcherClient,
                                                      TwirpException)
import lib.wdb_interface.rpc.searcher_pb2 as pb


class WDBError(Exception):
    pass


def questions_from_alphagrams(lexicon: Lexicon,
                              alphas: List[str],
                              expand: bool = False) -> Questions:
    """
    Given a list of alphagrams, get optionally fully populated questions.

    """
    # build search request
    resp = word_search([
        SearchDescription.lexicon(lexicon),
        SearchDescription.alphagram_list(alphas),
    ], expand)
    qs = Questions()
    qs.set_from_pb_alphagrams(resp.alphagrams)
    return qs


def word_search(search_descriptions: List[pb.SearchRequest.SearchParam],
                expand=False) -> pb.SearchResponse:
    client = QuestionSearcherClient(settings.WORD_DB_SERVER_ADDRESS)
    sr = pb.SearchRequest()
    sr.expand = expand
    for sd in search_descriptions:
        sr.searchparams.add(sd)
    try:
        response = client.search(sr)
    except TwirpException as e:
        raise WDBError(e)
    return response
