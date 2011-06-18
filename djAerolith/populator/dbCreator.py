# should use no Django, just direct cursor functions
from django.db import connection, transaction
import makedawg
import os
import codecs
from base.models import alphagrammize

os.environ['DJANGO_SETTINGS_MODULE'] = 'settings'

dbsToCreate = [('OWL2', 'North American English Word List'),
                ('CSW07', 'Collins 2007 English International Word List')]

class LexInfo:
    def __init__(self):
        self.shortName = ""
        self.longName = ""
        self.dawg = None
        self.rdawg = None

class Alph:
    def __init__(self, words, combinations, alpha):
        self.words = words
        self.combinations = combinations
        self.alpha = alpha

def numCombinations(alphagram):
    return 0




lexCounter = 4
lexInfos = {}
def createDbs():
    # prior to calling this function should flush 'base'    
    
    for d in dbsToCreate:
        l = LexInfo()
        l.shortName = d[0]
        l.longName = d[1]
        l.dawg = makedawg.populateDawg(d[0] + '.trie')
        l.rdawg = makedawg.populateDawg(d[0] + '_r.trie')
        lexInfos[l.shortName] = l

        createLexDb(l)
        lexCounter+=1
        
def createLexDb(l):
    dbName = l.shortName

    cursor = connection.cursor()
    f = codecs.open(dbName + '.txt', 'rb', 'utf-8')
    defsHash = {}
    alphasHash = {}
    for line in f:
        splitstr = line.split(' ', 1)
        if len(splitstr) >= 1 and len(splitstr[0]) > 1:
            word = splitstr[0].upper()
            if len(splitstr) == 2:
                definition = splitstr[1]
            else:
                definition = ''
            defsHash[word] = definition
            alphagram = alphagrammize(word)
            if alphagram not in alphasHash:
                alphasHash[alphagram] = Alph([], numCombinations(alphagram), alphagram)
            
            alphasHash[alphagram].words.append(word)
            backHooks = makedawg.findHooks(l.dawg, word)
            frontHooks = makedawg.findHooks(l.rdawg, word[::-1])
            lexSymbols = ""
            if l.shortName == "CSW":
                # create pounds
                if not lexInfos["OWL2"].dawg.findWord(word):
                    lexSymbols += "#"
    
            


def extractWords(infile):
    f = codecs.open(infile, 'rb', 'utf-8') 
    # first line is dimension
    words = []
    for line in f:
        splitstr = line.split()
        if len(splitstr) >= 1 and len(splitstr[0]) > 1:
            word = splitstr[0].lower()
            words.append(word)


    f.close()
    return words
    