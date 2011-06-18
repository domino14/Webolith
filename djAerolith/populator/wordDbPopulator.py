# Aerolith 2.0: A web-based word game website
# Copyright (C) 2011 Cesar Del Solar
# 
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
# 
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
# 
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

# To contact the author, please email delsolar at gmail dot com

# this file populates the Models with word information from databases; CSW, OSPD4, OWL2 
# FISE wil be supported soon, etc.

# for right now, since we're following the principle of MVP, these databases are pre-made
# using the old C++/Qt Aerolith program. In the future we will do the whole database creation in
# Python.

# the schema for these db's is the following:

#CREATE TABLE alphagrams(alphagram VARCHAR(15), words VARCHAR(255), probability INTEGER PRIMARY KEY, length INTEGER, num_vowels INTEGER);
#CREATE TABLE dbVersion(version INTEGER);
#CREATE TABLE lengthcounts(length INTEGER, numalphagrams INTEGER);
#CREATE TABLE wordlists(listname VARCHAR(40), numalphagrams INTEGER, probindices BLOB);
#CREATE TABLE words(alphagram VARCHAR(15), word VARCHAR(15), definition VARCHAR(256), lexiconstrings VARCHAR(5), front_hooks VARCHAR(26), back_hooks VARCHAR(26));
#CREATE UNIQUE INDEX alphagram_index on alphagrams(alphagram);
#CREATE UNIQUE INDEX word_index on words(word);



# cesar's note: this is unusably slow on a small AWS instance. the best way to do this is to probably dump the database from my dev
# machine and do something like load data infile into the mysql database directly.
# http://dev.mysql.com/doc/refman/5.1/en/load-data.html

#load data infile '/Users/cesar/coding/webolith/djAerolith/populator/alphagrams.txt' into table base_alphagram fields terminated by ",";
#load data infile '/Users/cesar/coding/webolith/djAerolith/populator/words.txt' into table base_word fields terminated by ',';
#load data infile '/Users/cesar/coding/webolith/djAerolith/populator/lexica.txt' into table base_lexicon fields terminated by ",";


import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'settings'

import sys
#sys.path.append('/home/ec2-user/Webolith/djAerolith')
sys.path.append('/Users/cesar/coding/webolith/djAerolith')

from base.models import Lexicon, Alphagram, Word, alphProbToProbPK
import sqlite3
import json
from django.db import transaction
import time

dbsToCreate = [('OWL2', 'North American English Word List'),
                ('CSW07', 'Collins 2007 English International Word List'),
#                ('OSPD4', 'North American School English Word List'),
                ]
                

@transaction.commit_on_success                
def createDatabases():
    # on my macbook pro this script takes like 30 minutes to run total for the three lexica.
    for d in dbsToCreate:
        dbName, dbDescription = d
        conn = sqlite3.connect(dbName+'.db')
        c = conn.cursor()
        lex = Lexicon(lexiconName = dbName, lexiconDescription = dbDescription)
        lex.save() # write lexicon to database
    
        c.execute("select alphagram, words, probability, length from alphagrams")
        lengthsDict = {}
        rc = 0
        times = [0, 0, 0, 0, 0, 0]
        for row in c:
            t = time.time()
            prob = row[2] & ((1 << 24) - 1)
            lexIndex = lex.pk
            length = row[3]
            times[0] += time.time() - t
            t = time.time()
            a = Alphagram(alphagram=row[0], probability=prob, length=length, 
                        probability_pk=alphProbToProbPK(prob, lexIndex, length), lexicon=lex)
            times[5] += time.time() - t
            t = time.time()
            a.save()    # write alphagram to database
            times[1] += time.time() - t
            if row[3] in lengthsDict:
                lengthsDict[row[3]] += 1
            else:
                lengthsDict[row[3]] = 1
            t = time.time()
            wc = conn.cursor()
            for str in row[1].split():
                x = time.time()
                wc.execute("select definition, lexiconstrings, front_hooks, back_hooks "
                  "from words where word = ?", (str,))
                times[2] += time.time() - x
                
                for wordrow in wc:
                    x = time.time()
                    w = Word(word=str, 
                            lexiconSymbols=wordrow[1] if wordrow[1] else '', 
                            front_hooks=wordrow[2] if wordrow[2] else '',
                            back_hooks=wordrow[3] if wordrow[3] else '', 
                            definition=wordrow[0] if wordrow[0] else '')
                    w.alphagram = a
                    w.lexicon = lex
                    w.save()
                    times[3] += time.time() - x
            times[4] += time.time() - t
            rc += 1
            if rc % 2000 == 0:
                print rc, times                
                times = [0, 0, 0, 0, 0, 0]
    
        lex.lengthCounts = json.dumps(lengthsDict)
        lex.save()
        print lex.lengthCounts
        print "Done with", dbName    
        
def createLengthCounts():
    # this function is not needed if the above function executes correctly
    for d in dbsToCreate:
        lex = Lexicon.objects.get(lexiconName=d[0])
        s = Alphagram.objects.filter(lexicon=lex)
        lengthsDict = {}
        for a in s:
            if a.length in lengthsDict:
                lengthsDict[a.length] += 1
            else:
                lengthsDict[a.length] = 1
        lex.lengthCounts = json.dumps(lengthsDict)
        lex.save()
        print lex, "done creating length counts"
        
        
if __name__=="__main__":
    createDatabases()    
