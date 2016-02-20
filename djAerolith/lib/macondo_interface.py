"""
Helper for communicating with macondo
See github.com/domino14/macondo

"""
import requests
import json
import uuid
import logging

from django.conf import settings

logger = logging.getLogger(__name__)


class MacondoError(Exception):
    pass


def gen_blank_challenges(length, lexicon_name, num_2_blanks, num_questions,
                         max_answers):
    """
    Generates a set of blank challenges given the lexicon name, length,
    number of 2-blank questions, and maximum answers permitted.

    """
    logger.debug('in gen_blank_challenges')
    resp = make_rpc_call('AnagramService.BlankChallenge',
                         {'word_length': length,
                          'num_questions': num_questions,
                          'lexicon_name': lexicon_name,
                          'max_answers': max_answers,
                          'num_2_blanks': num_2_blanks})
    # Already an array formatted like [{'q': ..., 'a': [...]}, ...]
    return resp['questions']


def make_rpc_call(procedure_name, arguments):
    """
    Note - we should only call this very sparingly, and with proper
    feedback on the front end. This function has indeterminate run time
    and blocks a Django worker.

    When we move over more stuff to Go/sockets/whatever we can call this
    more often (still with proper feedback).

    """
    headers = {'Content-Type': 'application/json'}
    data = {
        'jsonrpc': "2.0",
        'method': procedure_name,
        'id': str(uuid.uuid4()),
        'params': {
            'wordLength': arguments['word_length'],
            'numQuestions': arguments['num_questions'],
            'lexicon': arguments['lexicon_name'],
            'maxSolutions': arguments['max_answers'],
            'num2Blanks': arguments['num_2_blanks']
        }
    }
    rpc_address = settings.MACONDO_ADDRESS + '/rpc'
    try:
        response = requests.post(rpc_address, headers=headers,
                                 data=json.dumps(data))
    except requests.ConnectionError as e:
        raise MacondoError(e)
    try:
        resp = response.json()
    except ValueError:
        raise MacondoError(response.content)
    if 'error' in resp:
        raise MacondoError(resp['error']['message'])
    return resp['result']
