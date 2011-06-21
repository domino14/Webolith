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

class DatabaseCreator : public QObject
{
    Q_OBJECT
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
    void updateDefinitions(QHash<QString, QString>& defHash, int progress);
    QString followDefinitionLinks(QString definition, QHash<QString, QString>& defHash, bool useFollow, int maxDepth);
    QString getSubDefinition(const QString& word, const QString& pos, QHash<QString, QString>& defHash);

    QTextStream alphStream, wordStream, lexStream;
    QFile alphFile, wordFile, lexFile;
    int wordIndex;
    QString escapeStr(QString str);
    QString stringifyArray(int*);
signals:
    void setProgressMessage(QString);
    void setProgressValue(int);
    void setProgressRange(int, int);
    void createdDatabase(QString);
    void doneCreatingDBs();

};

#endif // DATABASECREATOR_H
