from typing import List
from urllib.parse import urljoin

from django.conf import settings
import requests
from google.protobuf.json_format import MessageToDict, ParseDict
from requests.exceptions import HTTPError

from base.models import Lexicon
from lib.domain import Questions
from lib.wdb_interface.constants import TIMEOUT
from lib.wdb_interface.exceptions import WDBError
from lib.wdb_interface.word_searches import SearchDescription
import rpc.wordsearcher.searcher_pb2 as pb
import rpc.wordvault.api_pb2 as vaultpb


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
    pb_obj,
    endpoint_service: str,
    endpoint_name: str,
    expected_pb_response_obj,
    auth_token: str = "",
):
    wdb_addr = settings.WORD_DB_SERVER_ADDRESS

    try:
        headers = {"Accept-Encoding": "gzip"}
        if auth_token:
            headers["Authorization"] = "Bearer " + auth_token
        r = requests.post(
            f"{wdb_addr}/api/{endpoint_service}/{endpoint_name}",
            headers=headers,
            json=MessageToDict(pb_obj),
            timeout=TIMEOUT,
        )
        r.raise_for_status()

        resp_pb = ParseDict(r.json(), expected_pb_response_obj)
    except HTTPError as exc:
        logger.error(
            "HTTPError in make_pb_request: %s. Request payload: %s. Response: %s",
            exc,
            MessageToDict(pb_obj),
            exc.response.text if exc.response else "No response",
        )
        if exc.response and exc.response.status_code == 500:
            resp = exc.response.json()
            error_message = resp.get("message", "Unknown error")
            if "not supported" in error_message:
                raise WDBError("The selected lexicon is not supported. Please choose a valid lexicon.")
        raise WDBError(f"HTTP error occurred: {exc}")
    except Exception as e:
        logger.error("Unknown error in make_pb_request: %s", e)
        raise WDBError(f"Unknown error: {e}")

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


def add_to_wordvault(alphagram_list: List[str], lexicon: str, auth_token: str) -> int:
    req = vaultpb.AddCardsRequest()
    req.lexicon = lexicon
    req.alphagrams.extend(alphagram_list)

    response = make_pb_request(
        req,
        "wordvault.WordVaultService",
        "AddCards",
        vaultpb.AddCardsResponse(),
        auth_token,
    )
    return response.num_cards_added