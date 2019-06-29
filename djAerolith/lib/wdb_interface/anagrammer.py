import logging
from typing import List

from django.conf import settings

from lib.wdb_interface.exceptions import WDBError
from rpc.wordsearcher.searcher_pb2_twirp import (AnagrammerClient,
                                                 TwirpException)
import rpc.wordsearcher.searcher_pb2 as pb
logger = logging.getLogger(__name__)


def resp_to_alphagram_dicts(resp):
    alpha_dicts = []
    for q in resp.alphagrams:
        to_append = {'q': q.alphagram, 'a': [w.word for w in q.words]}
        alpha_dicts.append(to_append)

    return alpha_dicts


def gen_blank_challenges(length: int, lexicon_name: str, num_2_blanks: int,
                         num_questions: int, max_answers: int) -> List[dict]:
    """
    Generate a set of blank challenges with the given parameters.

    """
    client = AnagrammerClient(settings.WORD_DB_SERVER_ADDRESS)
    sr = pb.BlankChallengeCreateRequest(
        lexicon=lexicon_name,
        num_questions=num_questions,
        max_solutions=max_answers,
        num_with_2_blanks=num_2_blanks,
        word_length=length)

    try:
        response = client.blank_challenge_creator(sr)
    except TwirpException as e:
        raise WDBError(e)
    return resp_to_alphagram_dicts(response)


def gen_build_challenge(min_length: int, max_length: int, lexicon_name: str,
                        require_length_solution: bool, min_solutions: int,
                        max_solutions: int):
    client = AnagrammerClient(settings.WORD_DB_SERVER_ADDRESS)
    sr = pb.BuildChallengeCreateRequest(
        lexicon=lexicon_name,
        min_solutions=min_solutions,
        max_solutions=max_solutions,
        min_length=min_length,
        max_length=max_length,
        require_length_solution=require_length_solution
    )
    try:
        response = client.build_challenge_creator(sr)
    except TwirpException as e:
        raise WDBError(e)
    return resp_to_alphagram_dicts(response)


def anagram_letters(lexicon_name: str, letters: str,
                    mode=pb.AnagramRequest.Mode.EXACT):
    client = AnagrammerClient(settings.WORD_DB_SERVER_ADDRESS)
    sr = pb.AnagramRequest(
        lexicon=lexicon_name,
        letters=letters,
        mode=mode
    )
    try:
        response = client.anagram(sr)
    except TwirpException as e:
        raise WDBError(e)
    words = [w.word for w in response.words]
    return words