import wordwalls.settings
from base.models import alphagrammize
import redis
import logging
from base.models import Alphagram
logger = logging.getLogger(__name__)
from django.conf import settings
import time


class UserListParseException(Exception):
    pass


def get_alphas_from_words(file_contents):
    line_number = 0
    alpha_set = set()
    for line in file_contents:
        word = line.strip()
        if len(word) > 15:
            raise UserListParseException("List contains non-word elements")
        line_number += 1
        if line_number > wordwalls.settings.UPLOAD_FILE_LINE_LIMIT:
            raise UserListParseException(
                "List contains more words than the current allowed per-file "
                "limit of %d" % wordwalls.settings.UPLOAD_FILE_LINE_LIMIT)
        if len(word) > 1:
            alpha_set.add(alphagrammize(word))
    return alpha_set


def get_pks_from_alphas(alphas, lex_id):
    pk_list = []
    r = redis.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, db=0)
    pipe = r.pipeline()
    start = time.time()
    for alphagram in alphas:
        key = '%s:%s' % (alphagram, lex_id)
        pipe.get(key)
    try:
        pk_list_copy = pipe.execute()
    except redis.exceptions.ConnectionError:
        # Fall-back to database and log an error.
        logger.error("Redis seems to be down!")
        pk_list_copy = get_pks_from_alphas_orm(alphas, lex_id)
    addl_msg = ""

    for pk in pk_list_copy:
        if pk:
            pk_list.append(int(pk))
        else:
            addl_msg = ("Could not process all your alphagrams. "
                        "(Did you choose the right lexicon?)")
    logger.debug("Elapsed %s" % (time.time() - start))
    return pk_list, addl_msg


def get_pks_from_alphas_orm(alphas, lex_id):
    logger.debug('Falling back to database..')
    start = time.time()
    pks = []
    for alpha in alphas:
        alpha_inst = Alphagram.objects.get(alphagram=alpha, lexicon__pk=lex_id)
        pks.append(alpha_inst.probability_pk)
    logger.debug("Elapsed -- %s" % (time.time() - start))
    return pks
