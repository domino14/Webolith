"""
A file that we should possibly deprecate soon.

"""

import logging

FETCH_MANY_SIZE = 1000

logger = logging.getLogger(__name__)


def convert_list_to_in_param(l):
    """
    Convert a list to an `in` param to be used in a SQL query.

    """
    if len(l) > 1:
        return str(tuple(l))
    elif len(l) == 1:
        return '(%s)' % l[0]
    else:
        raise Exception('List must have at least one value.')


def migrate_alphagrams(questions, cursor):
    """ Migrate the list of questions to alphagrams. """
    question_ret = []
    if len(questions) < 1:
        print "This list had no questions."
        return question_ret
    if type(questions[0]) is int:
        # I don't care that I'm interpolating the string directly
        # here, I know these are all alphagrams and valid values.

        query = """
            SELECT word, base_alphagram.alphagram FROM base_word
            INNER JOIN base_alphagram ON base_word.alphagram_id =
            base_alphagram.probability_pk
            WHERE base_alphagram.probability_pk in %s
            """ % convert_list_to_in_param(questions)
        try:
            cursor.execute(query)
        except Exception:
            logger.exception("Query caused an exception: %s", query)
            raise Exception
        rows = cursor.fetchmany(FETCH_MANY_SIZE)
        last_question = None
        while rows:
            for row in rows:
                if row[1] != last_question:
                    obj = {'q': row[1], 'a': [row[0]]}
                    question_ret.append(obj)
                else:
                    question_ret[-1]['a'].append(row[0])
                last_question = row[1]

            rows = cursor.fetchmany(FETCH_MANY_SIZE)

    elif type(questions[0]) is dict:
        answers = {}
        word_pks = []
        for q in questions:
            for a in q['a']:
                word_pks.append(a)
        cursor.execute("""
            SELECT word, id FROM base_word WHERE base_word.id IN %s """ %
                       convert_list_to_in_param(word_pks))
        rows = cursor.fetchmany(FETCH_MANY_SIZE)
        while rows:
            for row in rows:
                answers[row[1]] = row[0]
            rows = cursor.fetchmany(FETCH_MANY_SIZE)

        for q in questions:
            question_ret.append({
                'q': q['q'],
                'a': [answers[a_idx] for a_idx in q['a']]
            })
    assert (
        len(question_ret) == len(questions),
        "Didn't match: %s, %s, %s, %s" % (
            len(question_ret), len(questions), question_ret, questions))
    return question_ret
