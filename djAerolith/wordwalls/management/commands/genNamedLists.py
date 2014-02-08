"""Generate the "named" default Aerolith lists."""

from django.core.management.base import NoArgsCommand
from base.models import Lexicon, Alphagram, alphProbToProbPK, alphagrammize
from wordwalls.models import NamedList
import json
import time
import re
import redis
from django.conf import settings


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


def get_alphagrams(min_pk, max_pk):
    """
    Get all alphagrams between min and max pk through a fast Redis query.

    Returns a list of tuples: (pk, alphagram).

    """
    r = redis.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT,
                    db=settings.REDIS_ALPHAGRAM_SOLUTIONS_DB)
    pipe = r.pipeline()
    for p in range(min_pk, max_pk+1):
        pipe.lrange(p, 0, -1)
    alphas = pipe.execute()
    return [(pk + min_pk, json.loads(a[0]).get('question'))
            for pk, a in enumerate(alphas)]


def get_words(min_alpha_pk, max_alpha_pk):
    """
    Get all words corresponding to alphagrams between min and max pk.

    Returns a list of tuples: (pk, [word1..wordn]), where a word is a
    hash containing lexicon info, the word, etc.

    """
    r = redis.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT,
                    db=settings.REDIS_ALPHAGRAM_SOLUTIONS_DB)
    pipe = r.pipeline()
    for p in range(min_alpha_pk, max_alpha_pk+1):
        pipe.lrange(p, 0, -1)
    alphas = pipe.execute()
    ret_list = []
    for pk, info in enumerate(alphas):
        # The words are in elements info[1:]
        ret_list.append(
            (pk + min_alpha_pk,
             [json.loads(i) for i in info[1:]]))
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
    create_common_words_list('common_short.txt',
                             'Common Short Words (8 or fewer letters)')
    create_common_words_list('common_long.txt',
                             'Common Long Words (greater than 8 letters)')


def create_common_words_list(lname, friendly_name):
    f = open(COMMON_WORDS_DIR + lname)
    words = f.read()
    f.close()
    words = words.split('\n')
    r = redis.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT,
                    db=settings.REDIS_ALPHAGRAMS_DB)
    pipe = r.pipeline()
    for word in words:
        alpha = alphagrammize(word)
        pipe.get('%s:%s' % (alpha, OWL2_LEX_INDEX))
    pks = pipe.execute()

    pks = [int(pk) for pk in pks]
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
        create_common_words_lists()
        for lex in Lexicon.objects.filter(lexiconName__in=['OWL2', 'CSW12']):
            createNamedLists(lex)
