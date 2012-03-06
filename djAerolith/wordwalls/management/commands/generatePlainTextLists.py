# generates plain text lists for download

from django.core.management.base import BaseCommand, CommandError
from base.models import Alphagram, Lexicon, alphProbToProbPK, Word
import json

class Command(BaseCommand):
    def handle(self, *args, **options):
        lex = Lexicon.objects.get(lexiconName='OWL2')
        lengthCounts = json.loads(lex.lengthCounts)
        for length in range(5, 10):
            for prob in range(1, lengthCounts[str(length)], 1000):
                ppk_low = alphProbToProbPK(prob, lex.pk, length)
                ppk_high = alphProbToProbPK(prob+999, lex.pk, length)
                alphas = Alphagram.objects.filter(probability_pk__range=(ppk_low, ppk_high) )
                f = open('../wordsdir/%ds__%05d_to_%05d.txt' % (length, prob, len(alphas) + prob - 1), 'wb')
                for alpha in alphas:
                    words = alpha.word_set.all()
                    f.write(alpha.alphagram)
                    for word in words:
                        f.write(' ' + word.word)
                    f.write('\n')
                f.close()