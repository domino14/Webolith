import logging

import wordwalls.settings
from base.models import alphagrammize

logger = logging.getLogger(__name__)
FETCH_MANY_SIZE = 1000


class UserListParseException(Exception):
    pass


def get_alphas_from_words(contents):
    """
    Get all the alphagrams from the given words.

    """
    line_number = 0
    alpha_set = set()
    for line in contents.split('\n'):
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
