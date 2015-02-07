import wordwalls.settings
from base.models import alphagrammize
import logging
logger = logging.getLogger(__name__)
import time
from django.db import connection
FETCH_MANY_SIZE = 1000


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
    return get_pks_from_alphas_db(alphas, lex_id), ''


def get_pks_from_alphas_db(alphas, lex_id):
    logger.debug('Falling back to database..')
    start = time.time()
    pks = []
    cursor = connection.cursor()
    # XXX: Could this be vulnerable to SQL injection? The alphagrams are
    # actually alphagrams :P
    cursor.execute(
        'SELECT probability_pk FROM base_alphagram WHERE '
        'alphagram IN %s AND lexicon_id = %s' % (str(tuple(alphas)), lex_id))
    rows = cursor.fetchmany(FETCH_MANY_SIZE)
    while rows:
        for row in rows:
            pks.append(row[0])
        rows = cursor.fetchmany(FETCH_MANY_SIZE)
    logger.debug("DB - Elapsed %s" % (time.time() - start))
    return pks
