# generates a named list of alphagrams

from django.core.management.base import NoArgsCommand, CommandError
from base.models import Lexicon, Alphagram, alphProbToProbPK
from wordwalls.models import NamedList
import json
import time
import re


friendlyNumberMap = {
    2: 'Twos',
    3: 'Threes',
    4: 'Fours',
    5:'Fives',
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
COMMON_WORDS_DIR = 'base/misc'


def create_wl_lists(i, lex):
    """
        Creates word lists for words with length `i`.
    """
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
        # jqxz
        pks = []
        for p in range(minProbPk, maxProbPk+1):
            alph = Alphagram.objects.get(pk=p)
            if re.search(r'[JQXZ]', alph.alphagram):
                pks.append(p)

        nl= NamedList(lexicon=lex,
                      numQuestions=len(pks),
                      wordLength = i,
                      isRange=False,
                      questions=json.dumps(pks),
                      name='JQXZ ' + friendlyNumberMap[i])
        nl.save()

    if lex.lexiconName == 'CSW12':
        pks = []
        for p in range(minProbPk, maxProbPk+1):
            alph = Alphagram.objects.get(pk=p)
            if len(alph.word_set.filter(lexiconSymbols='#+')) > 0:
                # This is a CSW12 alphagram not in CSW07
                pks.append(p)

        nl = NamedList(lexicon=lex,
                       numQuestions=len(pks),
                       wordLength=i,
                       isRange=False,
                       questions=json.dumps(pks),
                       name='CSW12 ' + friendlyNumberMap[i] + ' not in CSW07')

        nl.save()

        pks = []
        for p in range(minProbPk, maxProbPk + 1):
            alph = Alphagram.objects.get(pk=p)
            # Contains a # or #+
            if len(alph.word_set.filter(lexiconSymbols__contains='#')) > 0 and 1 == 1:
                # this is a CSW 7 and/or 12 alphagram
                pks.append(p)

        nl = NamedList(lexicon=lex, numQuestions=len(pks), wordLength=i,
                       isRange=False,
                       questions=json.dumps(pks),
                       name='CSW12 ' + friendlyNumberMap[i] + ' not in OWL2')

        nl.save()

def createNamedLists(lex):
    # create lists for every word length
    t1 = time.time()
    for i in range(2, 16):
        create_wl_lists(i, lex)

    print lex, "elapsed", time.time() - t1


class Command(NoArgsCommand):
    help = """Populates database with named lists"""

    def handle_noargs(self, **options):
        NamedList.objects.all().delete()
        for lex in Lexicon.objects.filter(lexiconName__in=['OWL2', 'CSW12']):
            createNamedLists(lex)