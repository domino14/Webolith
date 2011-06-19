# this file is 'deprecated' and will be removed soon. replaced by Qt/C++ text file creator at webolith/dbCreator


# this is a fix to whatever strange bug was in the previous code that did not octothrope some words (like EMICANT)
# unfortunately it doesn't seem like I can do a LOAD DATA INFILE with new octothorped words, because of primary key collisions
# and if i reset the word database i'll lose the saved lists because of lexicon dependance.

import os
import time
import sys
os.environ['DJANGO_SETTINGS_MODULE'] = 'settings'
from django.conf import settings
sys.path.append('/Users/cesar/coding/webolith/djAerolith')



from base.models import Lexicon, Alphagram, Word, alphagrammize

csw = Lexicon.objects.get(lexiconName='CSW07')
owl2 = Lexicon.objects.get(lexiconName='OWL2')


#octothorped = Word.objects.filter(lexicon=csw).filter(lexiconSymbols = '#')

# wronglyOctothorped = []
# 
# print "octorphed length", len(octothorped)
# counter = 0
# for i in octothorped:
#     print counter
#         
#     try:
#         t = time.time()
#         w = Word.objects.get(word=i.word, lexicon=owl2)
#         wronglyOctothorped.append(w)
#     except:
#         print time.time() - t
#         pass
#     counter += 1
# 
# print "wrongly octothorped", wronglyOctothorped

unoctothorped = Word.objects.exclude(lexiconSymbols = '#').exclude(lexicon=owl2)
print "unoctothorped", len(unoctothorped)
counter = 0
shouldHaveOctothorpe = []
for i in unoctothorped:
    if counter %1000 == 0: print counter
    try:
        a = alphagrammize(i.word)
        aobj = Alphagram.objects.get_by_natural_key(alphagram=a, lexicon=owl2)
        # if we got the alphagram, find our word. if the alphagram wasn't there, this will raise an exception
        # meaning it should have an octothorpe but didn't
        
        words = Word.objects.filter(alphagram=aobj) # an OWL2 alphagram with a list of OWL2 words
        found = False
        for w in words:
            if w.word == i.word:
                found = True
        
        if not found: raise     # we didn't find this word in the OWL2 list, so it should have an octothorpe!
    except:
        shouldHaveOctothorpe.append(i.word)
    
    counter+=1

print "should have octothorpe", shouldHaveOctothorpe
print "length", len(shouldHaveOctothorpe)
# import json
# f = open('shouldHaveOct.txt')
# str = f.read()
# obj = json.loads(str)
# f.close()
# counter = 0
# for w in obj:
#     if counter % 100 == 0: print counter
#         
#     wo = Word.objects.filter(lexicon=csw).filter(word=w)
#     
#     wo[0].lexiconSymbols = "#"
#     wo[0].save()
#     counter+=1