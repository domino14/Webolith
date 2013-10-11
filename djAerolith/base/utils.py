from base.models import SavedList
import json


def alpha_to_python(alphagram):
    """
        Converts the alphagram model instance to a Python object.
    """
    return {
        'question': alphagram.alphagram,
        'probability': alphagram.probability,
        'id': alphagram.probability_pk,
        'answers': [{
            'word': word.word,
            'def': word.definition,
            'f_hooks': word.front_hooks,
            'b_hooks': word.back_hooks,
            'symbols': word.lexiconSymbols
        } for word in alphagram.word_set.all()]
    }


def savedlist_from_alphas(alphs):
    """
        Creates a SavedList instance from a new list of Alphagram models but
        *does not save it*.

        Assumes all alphs have the same lexicon.
    """
    num_alphas = alphs.count()
    if num_alphas == 0:
        raise Exception("No alphagrams provided.")
    li = SavedList()
    li.lexicon = alphs[0].lexicon
    li.numAlphagrams = num_alphas
    li.numCurAlphagrams = num_alphas
    li.numFirstMissed = 0
    li.numMissed = 0
    li.goneThruOnce = False
    li.questionIndex = 0
    li.origQuestions = json.dumps([alph.pk for alph in alphs])
    li.curQuestions = json.dumps(range(num_alphas))
    li.missed = json.dumps([])
    li.firstMissed = json.dumps([])
    q_map = {}
    for alph in alphs:
        q_map[alph.pk] = alpha_to_python(alph)

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
        'questionIndex': quiz.questionIndex
    }