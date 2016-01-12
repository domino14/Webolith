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

#ifndef DATABASECREATOR_H
#define DATABASECREATOR_H

#include <QObject>
#include <QString>
#include <QTextStream>
#include "lexiconinfo.h"

struct Alph
{
    QStringList words;
    int combinations;
    QString alphagram;
    Alph(QStringList w, int c, QString alph)
    {
        alphagram = alph; words = w; combinations = c;
    }
    Alph()
    {
    }

};

/**
 * This is a terrible hack for words longer than 10 letters where the
 * combinations exceeds MAX_INT32.
 * Why don't we use this everywhere? Because qSort does not sort the
 * alphagrams into the same order, when combinations are equal, if
 * we switch between quint64 and int. And we can't change old orders
 * now because it would corrupt old lists. However, for 11-letter long
 * and longer words, the probability ordering was already screwed up,
 * (https://github.com/domino14/Webolith/issues/108)
 * so it's fine to "corrupt" those lists, which are also very unlikely
 * (people don't study 11s and beyond).
 */
struct AlphQuint64
{
    QStringList words;
    quint64 combinations;
    QString alphagram;
    AlphQuint64(QStringList w, quint64 c, QString alph)
    {
        alphagram = alph; words = w; combinations = c;
    }
    AlphQuint64()
    {
    }

};

Q_DECLARE_METATYPE(Alph)
Q_DECLARE_METATYPE(AlphQuint64)


class DatabaseCreator : public QObject
{
public:
    DatabaseCreator(LexiconMap* lexiconMap);
    void createLexiconDatabases(QStringList dbsToCreate);
    ~DatabaseCreator();
private:

    LexiconMap* lexiconMap;
    enum SqlListMakerQueryTypes
    {
        ALPHAGRAM_QUERY, PROBABILITY_QUERY
    };

    QString reverse(QString word);
    void createLexiconDatabase(QString lexiconName);
    /*void sqlListMaker(QString queryString, QString listName, quint8 wordLength,
                      QSqlDatabase& db, SqlListMakerQueryTypes queryType = PROBABILITY_QUERY);*/
    void updateDefinitions(QHash<QString, QString>& defHash);
    QString followDefinitionLinks(QString definition,
                                  QHash<QString, QString>& defHash,
                                  bool useFollow, int maxDepth);
    QString getSubDefinition(const QString& word, const QString& pos,
                             QHash<QString, QString>& defHash);

};

#endif // DATABASECREATOR_H
