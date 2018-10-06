import logging

from base.models import alphagrammize
from lib.domain import Alphagram
from lib.word_db_helper import WordDB
from django.utils.translation import ugettext as _

logger = logging.getLogger(__name__)
FETCH_MANY_SIZE = 1000


class UserListParseException(Exception):
    pass


def get_alphas_from_words(contents: str, max_words):
    """
    Get all the alphagrams from the given words. Return a list of
    Alphagram objects.

    """
    line_number = 0
    alpha_set = set()
    for line in contents.split('\n'):
        word = line.strip()
        if len(word) > 15:
            raise UserListParseException(_("List contains non-word elements"))
        line_number += 1
        if line_number > max_words:
            raise UserListParseException(
                _("List contains more words than the current allowed per-file "
                  "limit of {}").format(max_words))
        if len(word) > 1:
            try:
                alpha_set.add(alphagrammize(word))
            except KeyError:
                raise UserListParseException(
                    _('List contains invalid characters.'))
    return [Alphagram(a) for a in alpha_set]


def generate_question_list(questions):
    """ Generate a question list from a Questions object."""
    q_list = []
    for q in questions.questions_array():
        q_list.append(q.to_python_full())
    return q_list


def generate_question_map(questions):
    """ Generate a question map from a Questions object. """
    q_map = {}

    for q in questions.questions_array():
        q_map[q.alphagram.alphagram] = q.to_python_full()
    return q_map


def generate_question_list_from_alphagrams(lexicon, alph_objects):
    """
    Generate a list of questions from a list of {'q': ..., 'a': [..]}
    objects.

    """
    db = WordDB(lexicon.lexiconName)
    return generate_question_list(
        db.get_questions_from_alph_dicts(alph_objects))


def generate_question_map_from_alphagrams(lexicon, alph_objects):
    """
    Generate a question map from a list of {'q': ..., 'a': [..]} objects.

    """
    db = WordDB(lexicon.lexiconName)
    return generate_question_map(
        db.get_questions_from_alph_dicts(alph_objects))


def question_list_from_probabilities(lexicon, p_min, p_max, length):
    """ Generate a list of questions from a probability range."""
    db = WordDB(lexicon.lexiconName)
    questions = db.get_questions_for_probability_range(p_min, p_max, length)
    return generate_question_list(questions)


def quizzes_response(quizzes):
    """
        Creates a response for quizzes.
        :quizzes an array of WordList models.
    """
    resp = []
    for quiz in quizzes:
        resp.append(quiz_response(quiz))
    return resp


def quiz_response(quiz):
    """
        :quiz A WordList.
    """
    return {
        'lexicon': quiz.lexicon.lexiconName,
        'lastSaved': quiz.lastSaved.strftime('%b %d, %Y %I:%M %p'),
        'name': quiz.name,
        'numAlphagrams': quiz.numAlphagrams,
        'numCurAlphagrams': quiz.numCurAlphagrams,
        'numMissed': quiz.numMissed,
        'numFirstMissed': quiz.numFirstMissed,
        'goneThruOnce': quiz.goneThruOnce,
        'questionIndex': quiz.questionIndex,
        'id': quiz.id
    }

