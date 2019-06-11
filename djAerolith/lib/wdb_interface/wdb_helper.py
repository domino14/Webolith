from typing import List

from django.conf import settings

from base.models import Lexicon
from lib.domain import Questions
from lib.wdb_interface.rpc.searcher_pb2_twirp import QuestionSearcherClient
import lib.wdb_interface.rpc.searcher_pb2 as pb


def questions_from_alphagrams(lexicon: Lexicon,
                              alphas: List[str],
                              expand: bool = False) -> Questions:
    """
    Given a list of alphagrams, get optionally fully populated questions.

    """
    client = QuestionSearcherClient(settings.WORD_DB_SERVER_ADDRESS)

    # build search request
    sr = pb.SearchRequest()
    sr.expand = expand
    sr.searchparams.add(
        condition=pb.SearchRequest.Condition.LEXICON,
        stringvalue=pb.SearchRequest.StringValue(
            value=lexicon.lexiconName
        )
    )
    sr.searchparams.add(
        condition=pb.SearchRequest.Condition.ALPHAGRAM_LIST,
        stringarray=pb.SearchRequest.StringArray(values=alphas)
    )

    response = client.search(sr)
    qs = Questions()
    qs.set_from_pb_alphagrams(response.alphagrams)
    return qs


def word_search(search_descriptions, expand=False):
    client = QuestionSearcherClient(settings.WORD_DB_SERVER_ADDRESS)

    sr = pb.SearchRequest()
    sr.expand = expand
    for sd in search_descriptions:
        sr.searchparams.add(
            condition=
        )
