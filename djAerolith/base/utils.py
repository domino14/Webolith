from base.models import SavedList
import json
import logging
logger = logging.getLogger(__name__)
from django.db import connection
FETCH_MANY_SIZE = 1000


def alpha_pk_to_python(pk, question, answers):
    """
        Converts the alphagram pk to a Python object.
        Requires the Redis db of words / alphagrams.

        :pk The pk of the question
        :question A question object.
        :answers A list of json dumps of answer objects.
    """
    answers = [json.loads(answer) for answer in answers]
    return {
        'question': question['question'],
        'probability': question['probability'],
        'id': pk,
        'answers': [{
            'word': word['word'],
            'def': word['def'],
            'f_hooks': word['f_hooks'],
            'b_hooks': word['b_hooks'],
            'symbols': word['symbols']
        } for word in answers]
    }


def generate_question_map(alphs):
    """
        Generates a question map from a list of alphagram pks.
    """
    q_map = {}
    # XXX: Database-specific code for speed. This might work with Postgres too.
    cursor = connection.cursor()
    cursor.execute(
        'SELECT word, alphagram_id, lexiconSymbols, definition, front_hooks, '
        'back_hooks, base_alphagram.alphagram, base_alphagram.probability '
        'FROM base_word INNER JOIN base_alphagram ON '
        'base_word.alphagram_id = base_alphagram.probability_pk WHERE '
        'base_alphagram.probability_pk in %s' % str(tuple(alphs))
    )
    rows = cursor.fetchmany(FETCH_MANY_SIZE)
    while rows:
        for row in rows:
            alph_pk = row[1]
            if alph_pk not in q_map:
                q_map[alph_pk] = {
                    'question': row[6],
                    'probability': row[7],
                    'id': alph_pk,
                    'answers': []
                }
            q_map[alph_pk]['answers'].append({
                'word': row[0],
                'def': row[3],
                'f_hooks': row[4],
                'b_hooks': row[5],
                'symbols': row[2]
            })
        rows = cursor.fetchmany(FETCH_MANY_SIZE)
    return q_map


def savedlist_from_alpha_pks(alphs, lexicon):
    """
        Creates a SavedList instance from a list of Alphagram pks (indices)
        but *does not save it*.
    """
    num_alphas = len(alphs)
    if num_alphas == 0:
        raise Exception("No alphagrams provided.")
    li = SavedList()
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
    q_map = generate_question_map(alphs)
    return li, q_map


def quizzes_response(quizzes):
    """
        Creates a response for quizzes.
        :quizzes an array of SavedList models.
    """
    resp = []
    for quiz in quizzes:
        resp.append(quiz_response(quiz))
    return resp


def quiz_response(quiz):
    """
        :quiz A SavedList.
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
