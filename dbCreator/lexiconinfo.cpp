//    Copyright 2007, 2008, 2009, 2010, 2011 Cesar Del Solar  <delsolar@gmail.com>
//    This file is part of Aerolith.
//
//    Some of this code is copyright Michael Thelen; noted below.
//
//    Aerolith is free software: you can redistribute it and/or modify
//    it under the terms of the GNU General Public License as published by
//    the Free Software Foundation, either version 3 of the License, or
//    (at your option) any later version.
//
//    Aerolith is distributed in the hope that it will be useful,
//    but WITHOUT ANY WARRANTY; without even the implied warranty of
//    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//    GNU General Public License for more details.
//
//    You should have received a copy of the GNU General Public License
//    along with Aerolith.  If not, see <http://www.gnu.org/licenses/>.

#include "lexiconinfo.h"
QList<QChar> letterList;
QHash <QChar, int> LexiconInfo::spanishTilesHash;
#include "utilities.h"

void LexiconInfo::resetLetterDistributionVariables()
{
    /* this function is basically taken from Michael Thelen's CreateDatabaseThread.cpp, part of Zyzzyva, which is
       GPLed software, source code available at http://www.zyzzyva.net, copyright Michael Thelen. */
    int maxFrequency = 15;

    int totalLetters = 0;

    foreach (unsigned char c, letterDist.keys())
    {
        int frequency = letterDist.value(c);
        totalLetters += frequency;
        if (frequency > maxFrequency)
            maxFrequency = frequency;
    }

    // Precalculate M choose N combinations - use doubles because the numbers
    // get very large
    double a = 1;
    double r = 1;
    for (int i = 0; i <= maxFrequency; ++i, ++r)
    {
        fullChooseCombos.append(a);
        a *= (totalLetters + 1.0 - r) / r;

        QList<double> subList;
        for (int j = 0; j <= maxFrequency; ++j)
        {
            if ((i == j) || (j == 0))
                subList.append(1.0);
            else if (i == 0)
                subList.append(0.0);
            else {
                // XXX: For some reason this crashes on Linux when referencing
                // the first value as subChooseCombos[i-1][j-1], so value() is
                // used instead.  Weeeeird.
                subList.append(subChooseCombos.value(i-1).value(j-1) +
                               subChooseCombos.value(i-1).value(j));
            }
        }
        subChooseCombos.append(subList);
    }

}

double LexiconInfo::combinations(QString alphagram)
{
    /* this function is basically taken from Michael Thelen's CreateDatabaseThread.cpp, part of Zyzzyva, which is
       GPLed software, source code available at http://www.zyzzyva.net, copyright Michael Thelen. */
    // Build parallel arrays of letters with their counts, and the
    // precalculated combinations based on the letter frequency
    QList<unsigned char> letters;
    QList<int> counts;
    QList<const QList<double>*> combos;
    for (int i = 0; i < alphagram.length(); ++i) {
        unsigned char c = alphagram.at(i).toAscii();

        bool foundLetter = false;
        for (int j = 0; j < letters.size(); ++j) {
            if (letters[j] == c) {
                ++counts[j];
                foundLetter = true;
                break;
            }
        }

        if (!foundLetter) {
            letters.append(c);
            counts.append(1);
            combos.append(&subChooseCombos[ letterDist[c] ]);
        }
    }

    // XXX: Generalize the following code to handle arbitrary number of blanks
    double totalCombos = 0.0;
    int numLetters = letters.size();

    // Calculate the combinations with no blanks
    double thisCombo = 1.0;
    for (int i = 0; i < numLetters; ++i) {
        thisCombo *= (*combos[i])[ counts[i] ];
    }
    totalCombos += thisCombo;

    // Calculate the combinations with one blank
    for (int i = 0; i < numLetters; ++i) {
        --counts[i];
        thisCombo = subChooseCombos[ letterDist['?'] ][1];
        for (int j = 0; j < numLetters; ++j) {
            thisCombo *= (*combos[j])[ counts[j] ];
        }
        totalCombos += thisCombo;
        ++counts[i];
    }

    // Calculate the combinations with two blanks
    for (int i = 0; i < numLetters; ++i) {
        --counts[i];
        for (int j = i; j < numLetters; ++j) {
            if (!counts[j])
                continue;
            --counts[j];
            thisCombo = subChooseCombos[ letterDist['?'] ][2];

            for (int k = 0; k < numLetters; ++k) {
                thisCombo *= (*combos[k])[ counts[k] ];
            }
            totalCombos += thisCombo;
            ++counts[j];
        }
        ++counts[i];
    }

    return totalCombos;

}


bool spanishLessThan(QChar i, QChar j)
{
    // anyone have a less horrible way of doing this?
    /*
    float x, y;
    x = (float)i.toLower();
    y = (float)tolower(j);


    if (x == '1') x = (float)'c' + 0.5; // 'ch' is in between c and d
    else if (x == '2') x = (float)'l' + 0.5; // 'll' is in between l and m
    else if (x == '3') x = (float)'r' + 0.5; // 'rr' is in between r and s
    else if (x == '4') x = (float)'n' + 0.5; // n-tilde is in between n and o

    if (y == '1') y = (float)'c' + 0.5; // 'ch' is in between c and d
    else if (y == '2') y = (float)'l' + 0.5; // 'll' is in between l and m
    else if (y == '3') y = (float)'r' + 0.5; // 'rr' is in between r and s
    else if (y == '4') y = (float)'n' + 0.5; // n-tilde is in between n and o

    return x < y;*/
    i = i.toLower();
    j = j.toLower();

    return (LexiconInfo::spanishTilesHash.value(i) < LexiconInfo::spanishTilesHash.value(j));
}


QString LexiconUtilities::alphagrammize(QString word, LessThans lessThan)
{
    QString ret;
    letterList.clear();
    for (int i = 0; i < word.size(); i++)
        letterList << word[i];
    if (lessThan == ENGLISH_LESS_THAN)
        qSort(letterList);
    else if (lessThan == SPANISH_LESS_THAN)
        qSort(letterList.begin(), letterList.end(), spanishLessThan);

    for (int i = 0; i < letterList.size(); i++)
        ret[i] = letterList[i];

    return ret;
}

quint32 LexiconUtilities::encodeProbIndex(quint32 probIndex, quint32 wordLength)
{
    return probIndex + (wordLength << 24);
}

QMap <unsigned char, int> getEnglishDist()
{
    QMap <unsigned char, int> dist;


    dist.insert('A', 9); dist.insert('B', 2); dist.insert('C', 2);
    dist.insert('D', 4); dist.insert('E', 12); dist.insert('F', 2);
    dist.insert('G', 3); dist.insert('H', 2); dist.insert('I', 9);
    dist.insert('J', 1); dist.insert('K', 1); dist.insert('L', 4);
    dist.insert('M', 2); dist.insert('N', 6); dist.insert('O', 8);
    dist.insert('P', 2); dist.insert('Q', 1); dist.insert('R', 6);
    dist.insert('S', 4); dist.insert('T', 6); dist.insert('U', 4);
    dist.insert('V', 2); dist.insert('W', 2); dist.insert('X', 1);
    dist.insert('Y', 2); dist.insert('Z', 1); dist.insert('?', 2);
    return dist;
}

QMap <unsigned char, int> getSpanishDist()
{
    QMap <unsigned char, int> dist;
    dist.insert('1', 1); dist.insert('2', 1); dist.insert('3', 1);
    dist.insert('A', 12); dist.insert('B', 2); dist.insert('C', 4);
    dist.insert('D', 5); dist.insert('E', 12); dist.insert('F', 1);
    dist.insert('G', 2); dist.insert('H', 2); dist.insert('I', 6);
    dist.insert('J', 1); dist.insert('L', 4); dist.insert('M', 2);
    dist.insert('N', 5); dist.insert('4', 1); dist.insert('O', 9);  // 4 is enye
    dist.insert('P', 2); dist.insert('Q', 1); dist.insert('R', 5);
    dist.insert('S', 6); dist.insert('T', 4); dist.insert('U', 5);
    dist.insert('V', 1); dist.insert('X', 1); dist.insert('Y', 1);
    dist.insert('Z', 1); dist.insert('?', 2);
    return dist;
}

void LexiconMap::createMap()
{
    map.clear();
    // creates a word list database.
    QMap <unsigned char, int> englishLetterDist = getEnglishDist();
    QMap <unsigned char, int> spanishLetterDist = getSpanishDist();

    map.insert("OWL2", LexiconInfo("OWL2", "OWL2.txt", englishLetterDist,
                                       "OWL2.trie", "OWL2_r.trie"));
    map.insert("CSW07", LexiconInfo("CSW07", "CSW07.txt", englishLetterDist, "CSW07.trie", "CSW07_r.trie"));


   /* map.insert("FISE", LexiconInfo("FISE", "fise.txt", spanishLetterDist, "fise.trie", "fise-r.trie"));
    map.insert("OSPD4+LWL", LexiconInfo("OSPD4+LWL", "ospd4-lwl.txt", englishLetterDist,
                                        "ospd4-lwl.trie", "ospd4-lwl-r.trie"));*/
    foreach (QString key, map.keys())
    {
        map[key].dawg.readDawg(Utilities::getRootDir() + "/words/" + map[key].dawgFilename);
        map[key].reverseDawg.readDawg(Utilities::getRootDir() + "/words/" + map[key].dawgRFilename);
    }
    qDebug() << "find emicant";
    qDebug() << "fidning emicant" << map["OWL2"].dawg.findWord("EMICANT");
    map["OWL2"].dawg.checkDawg(Utilities::getRootDir() + "/words/OWL2.txt");
    //map["FISE"].dawg.checkDawg(Utilities::getRootDir() + "/words/fise.txt");
    // populate the spanish tiles hash here
    int counter = 0;
    for (unsigned char c = 'a'; c <= 'c'; c++)
    {
        LexiconInfo::spanishTilesHash.insert(QChar(c), counter);
        counter++;
    }
    LexiconInfo::spanishTilesHash.insert(QChar('1'), counter);  // '1' = CH tile
    counter++;
    for (unsigned char c = 'd'; c <= 'l'; c++)
    {
        if (c == 'k') continue;
        LexiconInfo::spanishTilesHash.insert(QChar(c), counter);
        counter++;
    }
    LexiconInfo::spanishTilesHash.insert(QChar('2'), counter);  // '2' = LL tile
    counter++;
    for (unsigned char c = 'm'; c <= 'n'; c++)
    {
        LexiconInfo::spanishTilesHash.insert(QChar(c), counter);
        counter++;
    }
    LexiconInfo::spanishTilesHash.insert(QChar(0xF1), counter);  // enye tile
    counter++;
    for (unsigned char c = 'o'; c <= 'r'; c++)
    {
        LexiconInfo::spanishTilesHash.insert(QChar(c), counter);
        counter++;
    }
    LexiconInfo::spanishTilesHash.insert(QChar('3'), counter);  // '3' = RR tile
    counter++;
    for (unsigned char c = 's'; c <= 'z'; c++)
    {
        if (c == 'w') continue;
        LexiconInfo::spanishTilesHash.insert(QChar(c), counter);
        counter++;
    }
    Q_ASSERT(counter == 28);

}



