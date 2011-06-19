//    Copyright 2007, 2008, 2009, 2010, 2011 Cesar Del Solar  <delsolar@gmail.com>
//    This file is part of Aerolith.
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

#ifndef LEXICONINFO_H
#define LEXICONINFO_H

#include <QString>
#include <QMap>
#include <QList>
#include "dawg.h"

enum LessThans
{
    SPANISH_LESS_THAN, ENGLISH_LESS_THAN
};

class LexiconInfo
{
public:
    LexiconInfo(QString name, QString filename, QMap <unsigned char, int> d, QString df, QString drf, int lexIndex)
    {
        lexiconName = name;
        wordsFilename = filename; letterDist = d;
        dawgFilename = df;
        dawgRFilename = drf;
        alphagramsPerLength.resize(16);  // 0-15 index
        lexiconIndex = lexIndex;
    }
    LexiconInfo()
    {
        alphagramsPerLength.resize(16);
    }
    QVector <int> alphagramsPerLength;
    QString dawgFilename, dawgRFilename;
    Dawg dawg, reverseDawg;
    void resetLetterDistributionVariables();
    QString lexiconName;
    QString wordsFilename;
    double combinations(QString alphagram);
    static QHash <QChar, int> spanishTilesHash;
    int lexiconIndex;
private:

    QMap<unsigned char, int> letterDist;



    QList <double> fullChooseCombos;    // copied from Zyzzyva
    QList<QList<double> > subChooseCombos; // ditto



};

class LexiconMap
{
public:
    QMap<QString, LexiconInfo> map;
    void createMap();

};

namespace LexiconUtilities
{
    QString alphagrammize(QString, LessThans lessThan);
    quint32 encodeProbIndex(quint32 probIndex, quint32 wordLength, quint32 lexIndex);
}

#endif // LEXICONINFO_H
