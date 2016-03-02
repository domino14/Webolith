"""
We should try to have a separation between a game start and a game end
situation. Starting a game should be an idempotent API. State should be
kept in only one place - the socket handler.

"""

import json

from django.views.decorators.csrf import csrf_exempt

from wordwalls.models import WordwallsGameModel
from lib.response import response, StatusCode
from lib.word_db_helper import WordDB


def game_options(request, tablenum):
    """ Get initial game options. Contains things such as the timer, etc. """
    if request.method != 'GET':
        return response('Must use GET', status=StatusCode.BAD_REQUEST)
    try:
        wgm = WordwallsGameModel.objects.get(pk=tablenum)
    except WordwallsGameModel.DoesNotExist:
        return response('No such game.', StatusCode.BAD_REQUEST)
    return response(json.loads(wgm.game_options))


def get_start_state(request, tablenum):
    """
    An idempotent version of start_game. We should delete start_game.

    This should be a GET.

    """
    if request.method != 'GET':
        return response('Must use GET', status=StatusCode.BAD_REQUEST)

    state = {}
    try:
        wgm = WordwallsGameModel.objects.get(pk=tablenum)
    except WordwallsGameModel.DoesNotExist:
        return response(state)
    state['quizzingOnMissed'] = False
    wgm_state = json.loads(wgm.currentGameState)
    state.update(wgm_state)
    word_list = wgm.word_list


def start_game(request, tablenum):
    """
    View that will return the state for a newly started game.
    The most important part of the state is the answer hash and the
    list of questions.

    This should be a POST as it is not idempotent (it starts a game
    and advances the question index pointer!).

    """
    if request.method != 'POST':
        return response('Must use POST', status=StatusCode.BAD_REQUEST)

    state = {}
    try:
        wgm = WordwallsGameModel.objects.get(pk=tablenum)
    except WordwallsGameModel.DoesNotExist:
        return response(state)
    state['quizzingOnMissed'] = False

    # the "state" inside the wgm should have a very minimal representation
    # Just things like the time selection and number of answers per round
    # Perhaps the game type.
    wgm_state = json.loads(wgm.currentGameState)
    state.update(wgm_state)

    # Don't check if state['quizGoing']. Socket needs to check this.

    word_list = wgm.word_list

    if word_list.questionIndex > word_list.numCurAlphagrams - 1:
        word_list.set_to_missed()
        state['quizzingOnMissed'] = True

    if word_list.numCurAlphagrams == 0:
        # The quiz is done.
        state['quizIsDone'] = True
        return response(state)

    cur_questions_obj = json.loads(word_list.curQuestions)
    idx = word_list.questionIndex
    num_qs_per_round = wgm_state['questionsToPull']
    qs = cur_questions_obj[idx:(idx + num_qs_per_round)]
    state['qbegin'] = idx + 1
    state['qend'] = len(qs) + idx
    state['qtotal'] = word_list.numCurAlphagrams
    word_list.questionIndex += num_qs_per_round

    questions, answer_hash = load_questions(
        qs, json.loads(word_list.origQuestions), word_list.lexicon)
    # quizGoing and quizStarttime should be set by the socket.
    state['answerHash'] = answer_hash
    # numAnswersThisRound might not be needed.
    state['numAnswersThisRound'] = len(answer_hash)
    word_list.save()
    state['questions'] = questions
    return response(state)


def load_questions(qs, orig_questions, lexicon):
    """
    Turn the qs array into an array of full question objects, ready
    for the front-end.

    Params:
        - qs: An array of indices into oriq_questions
        - orig_questions: An array of questions, looking like
            [{'q': ..., 'a': [...]}, ...]

    Returns:
        - A tuple (questions, answer_hash)
            questions: [{'a': alphagram, 'ws': words, ...}, {..}, ..]
            answer_hash: {'the_word': {'a': alphagram, 'i': idx}, ...}

    """
    db = WordDB(lexicon.lexiconName)
    alphagrams_to_fetch = []
    index_map = {}
    for i in qs:
        alphagrams_to_fetch.append(orig_questions[i])
        index_map[orig_questions[i]['q']] = i

    questions = db.get_questions_from_alph_dicts(alphagrams_to_fetch)
    answer_hash = {}
    ret_q_array = []

    for q in questions.questions_array():
        words = []
        alphagram_str = q.alphagram.alphagram
        i = index_map[alphagram_str]
        for w in q.answers:
            words.append({'w': w.word, 'd': w.definition,
                          'fh': w.front_hooks, 'bh': w.back_hooks,
                          's': w.lexicon_symbols,
                          'ifh': w.inner_front_hook,
                          'ibh': w.inner_back_hook})
            answer_hash[w.word] = {'a': alphagram_str, 'i': i}
        ret_q_array.append({'a': alphagram_str, 'ws': words,
                            'p': q.alphagram.probability, 'idx': i})
    return ret_q_array, answer_hash
