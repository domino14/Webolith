from base.models import SavedList
import json
import redis
from django.conf import settings
import logging
logger = logging.getLogger(__name__)


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
    r = redis.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT,
                    db=settings.REDIS_ALPHAGRAM_SOLUTIONS_DB)
    pipe = r.pipeline()
    counter = 0
    results = []
    # Fetch 1000 at a time for speed.
    logger.debug('Iterating through indices.')
    for pk in alphs:
        pipe.lrange(pk, 0, -1)
        counter += 1
        if counter % 1000 == 0:
            results.extend(pipe.execute())
            pipe = r.pipeline()
    results.extend(pipe.execute())
    logger.debug('Got %s results' % len(results))
    for idx, result in enumerate(results):
        question = json.loads(result[0])
        # alphs and results are in the same order. (Or they damn better be).
        pk = alphs[idx]
        q_map[pk] = alpha_pk_to_python(pk, question, result[1:])
    logger.debug('Created map.')
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