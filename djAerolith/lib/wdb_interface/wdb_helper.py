from typing import List
from urllib.parse import urljoin

from django.conf import settings
import requests
from google.protobuf.json_format import MessageToDict, ParseDict

from base.models import Lexicon
from lib.domain import Questions
from lib.wdb_interface.constants import TIMEOUT
from lib.wdb_interface.exceptions import WDBError
from lib.wdb_interface.word_searches import SearchDescription
import rpc.wordsearcher.searcher_pb2 as pb


def questions_from_alphagrams(
    lexicon: Lexicon, alphas: List[str], expand: bool = False
) -> Questions:
    """
    Given a list of alphagrams, get optionally fully populated questions.

    """
    # build search request
    qs = word_search(
        [
            SearchDescription.lexicon(lexicon),
            SearchDescription.alphagram_list(alphas),
        ],
        expand,
    )
    return qs


def make_pb_request(
    pb_obj, endpoint_service: str, endpoint_name: str, expected_pb_response_obj
):
    """
    Sends a Protobuf object as JSON to a given API endpoint and returns the response as a Protobuf object.

    :param pb_obj: The Protobuf object to be sent in the request.
    :param endpoint_service: The service name (e.g. wordsearcher.QuestionSearcher)
    :param endpoint_name: The specific API endpoint to be called (e.g., "Expand").
    :param expected_pb_response: An instantiated pb object that is of the expected
    response type.
    :return: The Protobuf response object.
    """
    wdb_addr = settings.WORD_DB_SERVER_ADDRESS

    try:
        r = requests.post(
            f"{wdb_addr}/api/{endpoint_service}/{endpoint_name}",
            headers={"Accept-Encoding": "gzip"},
            json=MessageToDict(pb_obj),
            timeout=TIMEOUT,
        )
        resp_pb = ParseDict(r.json(), expected_pb_response_obj)
    except Exception as e:
        raise WDBError(e)

    return resp_pb


def questions_from_alpha_dicts(lexicon: Lexicon, alphas: List[dict]) -> Questions:
    """
    This has to use the client.expand function.
    alphas looks like:
        [{'q': ..., 'a': [...]}, ...] where everything is a string.
    """

    sr = pb.SearchResponse()
    sr.lexicon = lexicon.lexiconName
    pbas = []
    for alpha in alphas:
        words = []
        for w in alpha["a"]:
            words.append(pb.Word(word=w))

        pba = pb.Alphagram(alphagram=alpha["q"])
        pba.words.extend(words)
        pbas.append(pba)

    sr.alphagrams.extend(pbas)

    resp = make_pb_request(
        sr, "wordsearcher.QuestionSearcher", "Expand", pb.SearchResponse()
    )

    qs = Questions()
    qs.set_from_pb_alphagrams(resp.alphagrams)
    return qs


def questions_from_probability_range(
    lexicon: Lexicon, pmin: int, pmax: int, wl: int, expand: bool = False
):
    qs = word_search(
        [
            SearchDescription.lexicon(lexicon),
            SearchDescription.length(wl, wl),
            SearchDescription.probability_range(pmin, pmax),
        ],
        expand,
    )
    return qs


def questions_from_probability_list(
    lexicon: Lexicon, plist: List[int], wl: int, expand: bool = False
):
    qs = word_search(
        [
            SearchDescription.lexicon(lexicon),
            SearchDescription.length(wl, wl),
            SearchDescription.probability_list(plist),
        ],
        expand,
    )
    return qs


def word_search(
    search_descriptions: List[pb.SearchRequest.SearchParam], expand=False
) -> Questions:
    sr = pb.SearchRequest()
    sr.expand = expand
    sr.searchparams.extend(search_descriptions)

    response = make_pb_request(
        sr, "wordsearcher.QuestionSearcher", "Search", pb.SearchResponse()
    )

    qs = Questions()
    qs.set_from_pb_alphagrams(response.alphagrams)
    return qs
