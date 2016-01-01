import json
import logging

from base.models import WordList, alphagrammize
from lib.word_db_helper import WordDB, Alphagram

logger = logging.getLogger(__name__)
FETCH_MANY_SIZE = 1000


class UserListParseException(Exception):
    pass


def get_alphas_from_words(contents, max_words):
    """
    Get all the alphagrams from the given words. Return a list of
    Alphagram objects.

    """
    line_number = 0
    alpha_set = set()
    for line in contents.split('\n'):
        word = line.strip()
        if len(word) > 15:
            raise UserListParseException("List contains non-word elements")
        line_number += 1
        if line_number > max_words:
            raise UserListParseException(
                "List contains more words than the current allowed per-file "
                "limit of {}".format(max_words))
        if len(word) > 1:
            alpha_set.add(alphagrammize(word))
    return [Alphagram(a) for a in alpha_set]


def generate_question_map(lexicon, alphs):
    """ Generate a question map from a list of alphagrams. """
    db = WordDB(lexicon.lexiconName)
    q_map = {}

    db.get_questions(alphs)

    # XXX: Database-specific code for speed. This might work with Postgres too.
    # cursor = connection.cursor()
    # cursor.execute(
    #     'SELECT word, alphagram_id, lexiconSymbols, definition, front_hooks, '
    #     'back_hooks, inner_front_hook, inner_back_hook, '
    #     'base_alphagram.alphagram, base_alphagram.probability '
    #     'FROM base_word INNER JOIN base_alphagram ON '
    #     'base_word.alphagram_id = base_alphagram.probability_pk WHERE '
    #     'base_alphagram.probability_pk in %s' % str(tuple(alphs))
    # )
    # rows = cursor.fetchmany(FETCH_MANY_SIZE)
    # while rows:
    #     for row in rows:
    #         alph_pk = row[1]
    #         if alph_pk not in q_map:
    #             q_map[alph_pk] = {
    #                 'question': row[8],
    #                 'probability': row[9],
    #                 'id': alph_pk,
    #                 'answers': []
    #             }
    #         q_map[alph_pk]['answers'].append({
    #             'word': row[0],
    #             'def': row[3],
    #             'f_hooks': row[4],
    #             'b_hooks': row[5],
    #             'symbols': row[2],
    #             'f_inner': row[6],
    #             'b_inner': row[7]
    #         })
    #     rows = cursor.fetchmany(FETCH_MANY_SIZE)
    # return q_map


def savedlist_from_alpha_pks(alphs, lexicon):
    """
        Creates a WordList instance from a list of Alphagram pks (indices)
        but *does not save it*.
    """
    num_alphas = len(alphs)
    if num_alphas == 0:
        raise Exception("No alphagrams provided.")
    li = WordList()
    li.lexicon = lexicon
    li.numAlphagrams = num_alphas
    li.numCurAlphagrams = num_alphas
    li.numFirstMissed = 0
    li.numMissed = 0
    li.goneThruOnce = False
    li.questionIndex = 0
    li.origQuestions = json.dumps(alphs)
    li.curQuestions = json.dumps(range(num_alphas))
    li.missed = json.dumps([])
    li.firstMissed = json.dumps([])
    q_map = generate_question_map(lexicon, alphs)
    return li, q_map


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
