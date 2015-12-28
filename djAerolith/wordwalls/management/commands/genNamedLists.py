"""Generate the "named" default Aerolith lists."""

import json
import time
import re

from django.core.management.base import NoArgsCommand
from django.db import connection

from base.models import Lexicon, alphagrammize
from wordwalls.models import NamedList
from lib.word_db_helper import WordDB


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
    """ Get all questions that match the condition."""
    qs = []

    to_filter = db.get_questions_for_probability_range(min_prob, max_prob,
                                                       length)
    for q in to_filter:
        if condition_type == Condition.ALPHAGRAM:
            test = condition(q['q'])
        elif condition_type == Condition.WORD:
            test = any(condition(word) for word in q['a'])
        if test:
            # print 'passed test', q, q['q'], q['a'][0].word
            to_append = q
            to_append['a'] = [word.word for word in to_append['a']]
            qs.append(to_append)

    return qs


def create_wl_lists(i, lex, db):
    """Create word lists for words with length `i`."""

    length_counts = json.loads(lex.lengthCounts)
    num_for_this_length = length_counts[str(i)]
    min_prob = 1
    max_prob = num_for_this_length
    nl = NamedList(lexicon=lex,
                   numQuestions=num_for_this_length,
                   wordLength=i,
                   isRange=True,
                   questions=json.dumps([1, num_for_this_length]),
                   name='The ' + friendly_number_map[i])
    nl.save()
    if i >= 7 and i <= 8:
        # create 'every x' list
        for p in range(1, num_for_this_length+1, LIST_GRANULARITY):
            min_p = p
            max_p = min(p + LIST_GRANULARITY - 1, num_for_this_length)
            nl = NamedList(
                lexicon=lex,
                numQuestions=max_p - min_p + 1,
                wordLength=i,
                isRange=True,
                questions=json.dumps([min_p, max_p]),
                name='{} ({} to {})'.format(friendly_number_map[i], p, max_p))
            nl.save()

    print 'JQXZ', i
    if i >= 4 and i <= 8:
        qs = get_questions_by_condition(
            db, min_prob, max_prob, i,
            lambda a: re.search(r'[JQXZ]', a))
        nl = NamedList(lexicon=lex,
                       numQuestions=len(qs),
                       wordLength=i,
                       isRange=False,
                       questions=json.dumps(qs),
                       name='JQXZ ' + friendly_number_map[i])
        nl.save()

    if i == 7:
        # 4+ vowel 7s
        qs = get_questions_by_condition(
            db, min_prob, max_prob, i,
            lambda a: (len(re.findall(r'[AEIOU]', a)) >= 4))
        nl = NamedList(lexicon=lex,
                       numQuestions=len(qs),
                       wordLength=i,
                       isRange=False,
                       questions=json.dumps(qs),
                       name='Sevens with 4 or more vowels')
        nl.save()

    if i == 8:
        # 5+ vowel 8s
        qs = get_questions_by_condition(
            db, min_prob, max_prob, i,
            lambda a: (len(re.findall(r'[AEIOU]', a)) >= 5))
        nl = NamedList(lexicon=lex,
                       numQuestions=len(qs),
                       wordLength=i,
                       isRange=False,
                       questions=json.dumps(qs),
                       name='Eights with 5 or more vowels')
        nl.save()

    if lex.lexiconName == 'America':
        qs = get_questions_by_condition(
            db, min_prob, max_prob, i,
            lambda w: ('+' in w.lexiconSymbols),
            condition_type=Condition.WORD)

        nl = NamedList(
            lexicon=lex,
            numQuestions=len(qs),
            wordLength=i,
            isRange=False,
            questions=json.dumps(qs),
            name='America {} not in OWL2'.format(friendly_number_map[i]))

        nl.save()

        qs = get_questions_by_condition(
            db, min_prob, max_prob, i,
            lambda w: ('$' in w.lexiconSymbols),
            condition_type=Condition.WORD)

        nl = NamedList(
            lexicon=lex,
            numQuestions=len(qs),
            wordLength=i,
            isRange=False,
            questions=json.dumps(qs),
            name='America {} not in CSW15'.format(friendly_number_map[i]))

        nl.save()

    if lex.lexiconName == 'CSW15':
        qs = get_questions_by_condition(
            db, min_prob, max_prob, i,
            lambda w: ('+' in w.lexiconSymbols),
            condition_type=Condition.WORD)

        nl = NamedList(
            lexicon=lex,
            numQuestions=len(qs),
            wordLength=i,
            isRange=False,
            questions=json.dumps(qs),
            name='CSW15 {} not in CSW12'.format(friendly_number_map[i]))

        nl.save()

        qs = get_questions_by_condition(
            db, min_prob, max_prob, i,
            lambda w: ('#' in w.lexiconSymbols),
            condition_type=Condition.WORD)

        nl = NamedList(
            lexicon=lex,
            numQuestions=len(qs),
            wordLength=i,
            isRange=False,
            questions=json.dumps(qs),
            name='CSW15 {} not in America'.format(friendly_number_map[i]))

        nl.save()


def createNamedLists(lex):
    """Create the lists for every word length, given a lexicon."""
    # create lists for every word length
    t1 = time.time()
    db = WordDB(lex.lexiconName)
    for i in range(2, 16):
        create_wl_lists(i, lex, db)

    if lex.lexiconName == 'OWL2':
        create_common_words_lists()

    print lex, "elapsed", time.time() - t1


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
                lexiconName__in=['OWL2', 'CSW12', 'America', 'CSW15']):
            createNamedLists(lex)
