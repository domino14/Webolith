"""Generate the "named" default Aerolith lists."""

import json
import time
import re
import logging

from django.core.management.base import NoArgsCommand
from django.db import connection

from base.models import Lexicon, alphagrammize
from wordwalls.models import NamedList
from lib.word_db_helper import WordDB, Questions

logger = logging.getLogger(__name__)
friendly_number_map = {
    2: 'Twos',
    3: 'Threes',
    4: 'Fours',
    5: 'Fives',
    6: 'Sixes',
    7: 'Sevens',
    8: 'Eights',
    9: 'Nines',
    10: 'Tens',
    11: 'Elevens',
    12: 'Twelves',
    13: 'Thirteens',
    14: 'Fourteens',
    15: 'Fifteens'
}

LIST_GRANULARITY = 1000
COMMON_WORDS_DIR = 'base/misc/'
OWL2_LEX_INDEX = 4
FRIENDLY_COMMON_SHORT = 'Common Short Words (8 or fewer letters)'
FRIENDLY_COMMON_LONG = 'Common Long Words (greater than 8 letters)'


class Condition(object):
    WORD = 'word'
    ALPHAGRAM = 'alphagram'


def get_questions_by_condition(db, min_prob, max_prob, length, condition,
                               condition_type='alphagram'):
    """
    Get all questions that match the condition. Return a to_python
    representation, ready for saving into the list.

    """
    qs = Questions()

    to_filter = db.get_questions_for_probability_range(min_prob, max_prob,
                                                       length)
    for q in to_filter.questions_array():
        if condition_type == Condition.ALPHAGRAM:
            test = condition(q.alphagram.alphagram)
        elif condition_type == Condition.WORD:
            test = any(condition(word) for word in q.answers)
        if test:
            # print 'passed test', q, q['q'], q['a'][0].word
            qs.append(q)

    return qs.to_python()


def create_named_list(lexicon, num_questions, word_length, is_range,
                      questions, name):
    if num_questions == 0:
        logger.debug(">> Not creating empty list " + name)
        return

    nl = NamedList(lexicon=lexicon,
                   numQuestions=num_questions,
                   wordLength=word_length,
                   isRange=is_range,
                   questions=questions,
                   name=name)
    nl.full_clean()
    nl.save()


def create_wl_lists(i, lex, db):
    """Create word lists for words with length `i`."""
    logger.debug('Creating WL for lex %s, length %s', lex.lexiconName, i)
    length_counts = json.loads(lex.lengthCounts)
    num_for_this_length = length_counts[str(i)]
    min_prob = 1
    max_prob = num_for_this_length
    create_named_list(lex, num_for_this_length, i, True,
                      json.dumps([1, num_for_this_length]),
                      'The ' + friendly_number_map[i])
    if i >= 7 and i <= 8:
        # create 'every x' list
        for p in range(1, num_for_this_length+1, LIST_GRANULARITY):
            min_p = p
            max_p = min(p + LIST_GRANULARITY - 1, num_for_this_length)
            create_named_list(
                lex, max_p - min_p + 1, i, True, json.dumps([min_p, max_p]),
                '{} ({} to {})'.format(friendly_number_map[i], p, max_p))

    if i >= 4 and i <= 8:
        qs = get_questions_by_condition(
            db, min_prob, max_prob, i,
            lambda a: re.search(r'[JQXZ]', a))
        create_named_list(lex, len(qs), i, False, json.dumps(qs),
                          'JQXZ ' + friendly_number_map[i])

    if i == 7:
        # 4+ vowel 7s
        qs = get_questions_by_condition(
            db, min_prob, max_prob, i,
            lambda a: (len(re.findall(r'[AEIOU]', a)) >= 4))
        create_named_list(lex, len(qs), i, False, json.dumps(qs),
                          'Sevens with 4 or more vowels')
    if i == 8:
        # 5+ vowel 8s
        qs = get_questions_by_condition(
            db, min_prob, max_prob, i,
            lambda a: (len(re.findall(r'[AEIOU]', a)) >= 5))
        create_named_list(lex, len(qs), i, False, json.dumps(qs),
                          'Eights with 5 or more vowels')

    if lex.lexiconName == 'America':
        qs = get_questions_by_condition(
            db, min_prob, max_prob, i,
            lambda w: ('+' in w.lexicon_symbols),
            condition_type=Condition.WORD)
        create_named_list(
            lex, len(qs), i, False, json.dumps(qs),
            'America {} not in OWL2'.format(friendly_number_map[i]))

        qs = get_questions_by_condition(
            db, min_prob, max_prob, i,
            lambda w: ('$' in w.lexicon_symbols),
            condition_type=Condition.WORD)
        create_named_list(
            lex, len(qs), i, False, json.dumps(qs),
            'America {} not in CSW15'.format(friendly_number_map[i]))

        if i == 4:
            qs = get_questions_by_condition(
                db, min_prob, max_prob, i,
                lambda w: ('+' in w.lexicon_symbols and
                           re.search(r'[JQXZ]', w.word) and
                           len(w.word) == 4),
                condition_type=Condition.WORD)
            create_named_list(
                lex, len(qs), i, False, json.dumps(qs),
                'America JQXZ 4s not in OWL2')
        elif i == 5:
            qs = get_questions_by_condition(
                db, min_prob, max_prob, i,
                lambda w: ('+' in w.lexicon_symbols and
                           re.search(r'[JQXZ]', w.word) and
                           len(w.word) == 5),
                condition_type=Condition.WORD)
            create_named_list(
                lex, len(qs), i, False, json.dumps(qs),
                'America JQXZ 5s not in OWL2')

        elif i == 6:
            qs = get_questions_by_condition(
                db, min_prob, max_prob, i,
                lambda w: ('+' in w.lexicon_symbols and
                           re.search(r'[JQXZ]', w.word) and
                           len(w.word) == 6),
                condition_type=Condition.WORD)
            create_named_list(
                lex, len(qs), i, False, json.dumps(qs),
                'America JQXZ 6s not in OWL2')

    if lex.lexiconName == 'CSW15':
        qs = get_questions_by_condition(
            db, min_prob, max_prob, i,
            lambda w: ('+' in w.lexicon_symbols),
            condition_type=Condition.WORD)
        create_named_list(
            lex, len(qs), i, False, json.dumps(qs),
            'CSW15 {} not in CSW12'.format(friendly_number_map[i]))

        qs = get_questions_by_condition(
            db, min_prob, max_prob, i,
            lambda w: ('#' in w.lexicon_symbols),
            condition_type=Condition.WORD)
        create_named_list(
            lex, len(qs), i, False, json.dumps(qs),
            'CSW15 {} not in America'.format(friendly_number_map[i]))


def createNamedLists(lex):
    """Create the lists for every word length, given a lexicon."""
    # create lists for every word length
    t1 = time.time()
    db = WordDB(lex.lexiconName)
    for i in range(2, 16):
        create_wl_lists(i, lex, db)

    if lex.lexiconName == 'OWL2':
        create_common_words_lists()

    logger.debug('%s, elapsed %s', lex, time.time() - t1)


def create_common_words_lists():
    """Creates common words lists for OWL2."""
    return
    create_common_words_list('common_short.txt', FRIENDLY_COMMON_SHORT)
    create_common_words_list('common_long.txt', FRIENDLY_COMMON_LONG)


def create_common_words_list(lname, friendly_name):
    f = open(COMMON_WORDS_DIR + lname)
    words = f.read()
    f.close()
    words = words.split('\n')
    alphs = set([alphagrammize(word) for word in words])
    cursor = connection.cursor()
    cursor.execute(
        'SELECT probability_pk FROM base_alphagram '
        'WHERE lexicon_id = %s AND alphagram in %s' %
        (OWL2_LEX_INDEX, str(tuple(alphs)))
    )
    rows = cursor.fetchall()
    pks = []
    for row in rows:
        pks.append(row[0])
    nl = NamedList(lexicon=Lexicon.objects.get(lexiconName='OWL2'),
                   numQuestions=len(pks),
                   wordLength=0,
                   isRange=False,
                   questions=json.dumps(pks),
                   name=friendly_name)

    nl.save()


class Command(NoArgsCommand):
    help = """Populates database with named lists"""

    def handle_noargs(self, **options):
        NamedList.objects.all().delete()
        for lex in Lexicon.objects.filter(
                lexiconName__in=['America', 'CSW15']):
            createNamedLists(lex)
