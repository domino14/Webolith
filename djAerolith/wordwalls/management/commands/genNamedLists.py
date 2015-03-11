"""Generate the "named" default Aerolith lists."""

from django.core.management.base import NoArgsCommand
from base.models import Lexicon, Alphagram, alphProbToProbPK, alphagrammize
from wordwalls.models import NamedList
import json
import time
import re
from django.conf import settings
from django.db import connection


friendlyNumberMap = {
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


def get_alphagrams(min_pk, max_pk):
    """
    Get all alphagrams between min and max pk through a fast query.

    Returns a list of tuples: (pk, alphagram).

    """
    cursor = connection.cursor()
    cursor.execute(
        'SELECT probability_pk, alphagram FROM base_alphagram WHERE '
        'probability_pk BETWEEN %s and %s' % (min_pk, max_pk)
    )
    rows = cursor.fetchall()
    return rows


def get_words(min_alpha_pk, max_alpha_pk):
    """
    Get all words corresponding to alphagrams between min and max pk.

    Returns a list of tuples: (pk, [word1..wordn]), where a word is a
    hash containing lexicon info, the word, etc.

    """
    ret_list = []
    cursor = connection.cursor()
    cursor.execute(
        'SELECT word, alphagram_id, lexiconSymbols, definition, front_hooks, '
        'back_hooks, base_alphagram.alphagram, base_alphagram.probability '
        'FROM base_word INNER JOIN base_alphagram ON '
        'base_word.alphagram_id = base_alphagram.probability_pk WHERE '
        'base_alphagram.probability_pk BETWEEN %s and %s '
        'ORDER BY alphagram_id' % (min_alpha_pk, max_alpha_pk)
    )
    rows = cursor.fetchall()
    last_alpha_id = None
    cur_words = []
    for row in rows:
        alpha_id = row[1]
        if alpha_id != last_alpha_id and last_alpha_id is not None:
            # Alphagram changed, append current word set and start a new one.
            ret_list.append((last_alpha_id, cur_words))
            cur_words = []
        cur_words.append({
                         'symbols': row[2],
                         'def': row[3],
                         'f_hooks': row[4],
                         'b_hooks': row[5],
                         'word': row[0]
                         })
        last_alpha_id = alpha_id
    ret_list.append((last_alpha_id, cur_words))
    return ret_list


def get_pks_by_condition(min_pk, max_pk, condition):
    """
    Get all alphagram pks that match the condition.

    Returns a list of pks.

    """
    pks = []
    alphas = get_alphagrams(min_pk, max_pk)
    for a in alphas:
        pk, alpha = a
        if condition(alpha):
            pks.append(pk)
    return pks


def get_pks_by_word_condition(min_alpha_pk, max_alpha_pk, condition):
    """
    Get all alphagram pks where at least one word matches the condition.

    Returns a list of pks.

    """
    pks = []
    words = get_words(min_alpha_pk, max_alpha_pk)
    for w in words:
        pk, word_list = w
        if any(condition(word) for word in word_list):
            pks.append(pk)
    return pks


def create_wl_lists(i, lex):
    """Create word lists for words with length `i`."""

    lengthCounts = json.loads(lex.lengthCounts)
    numForThisLength = lengthCounts[str(i)]
    minProbPk = alphProbToProbPK(1, lex.pk, i)
    maxProbPk = alphProbToProbPK(numForThisLength, lex.pk, i)

    nl = NamedList(lexicon=lex,
                   numQuestions=numForThisLength,
                   wordLength=i,
                   isRange=True,
                   questions=json.dumps([minProbPk, maxProbPk]),
                   name='The ' + friendlyNumberMap[i])
    nl.save()
    if i >= 7 and i <= 8:
        # create 'every x' list
        for p in range(1, numForThisLength+1, LIST_GRANULARITY):
            minP = alphProbToProbPK(p, lex.pk, i)
            maxP = alphProbToProbPK(
                min(p + LIST_GRANULARITY - 1, numForThisLength), lex.pk, i)

            nl = NamedList(
                lexicon=lex,
                numQuestions=maxP - minP + 1,
                wordLength=i,
                isRange=True,
                questions=json.dumps([minP, maxP]),
                name='%s (%s to %s)' % (friendlyNumberMap[i], p,
                                        min(p + LIST_GRANULARITY - 1,
                                            numForThisLength)))
            nl.save()

    print 'JQXZ', i
    if i >= 4 and i <= 8:
        pks = get_pks_by_condition(
            minProbPk, maxProbPk,
            lambda a: re.search(r'[JQXZ]', a))
        nl = NamedList(lexicon=lex,
                       numQuestions=len(pks),
                       wordLength=i,
                       isRange=False,
                       questions=json.dumps(pks),
                       name='JQXZ ' + friendlyNumberMap[i])
        nl.save()

    if i == 7:
        # 4+ vowel 7s
        pks = get_pks_by_condition(
            minProbPk, maxProbPk,
            lambda a: (len(re.findall(r'[AEIOU]', a)) >= 4))
        nl = NamedList(lexicon=lex,
                       numQuestions=len(pks),
                       wordLength=i,
                       isRange=False,
                       questions=json.dumps(pks),
                       name='Sevens with 4 or more vowels')
        nl.save()

    if i == 8:
        # 5+ vowel 8s
        pks = get_pks_by_condition(
            minProbPk, maxProbPk,
            lambda a: (len(re.findall(r'[AEIOU]', a)) >= 5))
        nl = NamedList(lexicon=lex,
                       numQuestions=len(pks),
                       wordLength=i,
                       isRange=False,
                       questions=json.dumps(pks),
                       name='Eights with 5 or more vowels')
        nl.save()

    if lex.lexiconName == 'CSW12':
        pks = get_pks_by_word_condition(
            minProbPk, maxProbPk,
            lambda w: (w.get('symbols') == '#+'))

        nl = NamedList(lexicon=lex,
                       numQuestions=len(pks),
                       wordLength=i,
                       isRange=False,
                       questions=json.dumps(pks),
                       name='CSW12 ' + friendlyNumberMap[i] + ' not in CSW07')

        nl.save()

        pks = get_pks_by_word_condition(
            minProbPk, maxProbPk,
            lambda w: ('#' in w.get('symbols')))

        nl = NamedList(lexicon=lex, numQuestions=len(pks), wordLength=i,
                       isRange=False,
                       questions=json.dumps(pks),
                       name='CSW12 ' + friendlyNumberMap[i] + ' not in OWL2')

        nl.save()

    if lex.lexiconName == 'America':
        pks = get_pks_by_word_condition(
            minProbPk, maxProbPk,
            lambda w: (w.get('symbols') == '+'))

        nl = NamedList(lexicon=lex,
                       numQuestions=len(pks),
                       wordLength=i,
                       isRange=False,
                       questions=json.dumps(pks),
                       name='America ' + friendlyNumberMap[i] + ' not in OWL2')

        nl.save()


def createNamedLists(lex):
    """Create the lists for every word length, given a lexicon."""
    # create lists for every word length
    t1 = time.time()
    for i in range(2, 16):
        create_wl_lists(i, lex)

    if lex.lexiconName == 'OWL2':
        create_common_words_lists()

    print lex, "elapsed", time.time() - t1


def create_common_words_lists():
    """Creates common words lists for OWL2."""
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
                lexiconName__in=['OWL2', 'CSW12', 'America']):
            createNamedLists(lex)
