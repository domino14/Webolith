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

#include "utilities.h"
#include "databasecreator.h"
#include <iostream>
bool probLessThan(const Alph &a1, const Alph &a2)
{
    return a1.combinations > a2.combinations;
}

DatabaseCreator::DatabaseCreator(LexiconMap* lexiconMap)
{
    this->lexiconMap = lexiconMap;
    qDebug() << "In db creator";
}


void DatabaseCreator::createLexiconDatabases(QStringList dbsToCreate)
{
    qDebug() << "Creating lexicon databases..." << dbsToCreate;
    qDebug() << dbsToCreate.length();
    foreach (QString key, dbsToCreate)
        qDebug() << key;
    foreach (QString key, dbsToCreate)
    {


        if (!lexiconMap->map.contains(key)) continue;
        createLexiconDatabase(key);
        emit createdDatabase(key);
    }

    qDebug() << "Done creating databases!";
}

QString DatabaseCreator::reverse(QString word)
{
    /* reverses a word */
    QString ret;
    for (int i = word.length()-1; i >= 0; i--)
        ret += word[i];

    return ret;
}

void DatabaseCreator::createLexiconDatabase(QString lexiconName)
{
    qDebug() << lexiconName.toAscii().constData() << ": Loading word graphs...";
    QTime time;
    time.start();
    qDebug() << "Create" << lexiconName;
    LexiconInfo* lexInfo = &(lexiconMap->map[lexiconName]);
    /*
    lexInfo->dawg.readDawg(Utilities::getRootDir() + "/words/" + lexInfo->dawgFilename);
    lexInfo->reverseDawg.readDawg(Utilities::getRootDir() + "/words/" + lexInfo->dawgRFilename);*/

    lexInfo->resetLetterDistributionVariables();
    qDebug() << lexiconName.toAscii().constData() << ": Reading in dictionary.";

    QHash <QString, Alph> alphagramsHash;

    QFile file(Utilities::getRootDir() + "/words/" + lexInfo->wordsFilename);
    if (!file.open(QIODevice::ReadOnly)) return;
    QSqlDatabase db =  QSqlDatabase::addDatabase("QSQLITE", lexiconName + "DB");
    db.setDatabaseName(lexiconName + ".db");
    db.open();
    QSqlQuery wordQuery(db);
    wordQuery.exec("CREATE TABLE IF NOT EXISTS dbVersion(version INTEGER)");
    wordQuery.exec("INSERT INTO dbVersion(version) VALUES(1)"); // version 1
    wordQuery.exec("CREATE TABLE IF NOT EXISTS words(alphagram VARCHAR(15), word VARCHAR(15), "
                   "definition VARCHAR(256), lexiconstrings VARCHAR(5), front_hooks VARCHAR(26), "
                   "back_hooks VARCHAR(26))");
    wordQuery.exec("CREATE TABLE IF NOT EXISTS alphagrams(alphagram VARCHAR(15), words VARCHAR(255), "
                   "probability INTEGER PRIMARY KEY, length INTEGER, num_vowels INTEGER)");

    wordQuery.exec("CREATE TABLE IF NOT EXISTS wordlists(listname VARCHAR(40), numalphagrams INTEGER, probindices BLOB)");
    wordQuery.exec("CREATE TABLE IF NOT EXISTS lengthcounts(length INTEGER, numalphagrams INTEGER)");
    // TOO create index for wordlists?
    LessThans lessThan;
    if (lexInfo->lexiconName == "FISE") lessThan = SPANISH_LESS_THAN;
    else lessThan = ENGLISH_LESS_THAN;

    bool updateCSWPoundSigns = (lexiconName == "CSW07");
    /* update lexicon symbols if this is CSW (compare to OWL2)*/
    LexiconInfo* lexInfoAmerica = &(lexiconMap->map["OWL2"]);


    QTextStream in(&file);
    QString queryText = "INSERT INTO words(alphagram, word, definition, lexiconstrings, front_hooks, back_hooks) "
                        "VALUES(?, ?, ?, ?, ?, ?) ";
    wordQuery.exec("BEGIN TRANSACTION");
    wordQuery.prepare(queryText);
    QHash <QString, QString> definitionsHash;
    QStringList dummy;

    int wordCount = 0;
    while (!in.atEnd())
    {
        in.readLine();
        wordCount++;
    }
    in.seek(0);
    emit setProgressRange(0, wordCount*3);   // 1 accounts for reading the words, 2 accounts for alph, 3 for fixing defs
    emit setProgressValue(0);
    int progress = 0;
    while (!in.atEnd())
    {
        QString line = in.readLine();
        line = line.simplified();
        if (line.length() > 0)
        {
            progress++;
            if (progress%1000 == 0)
                emit setProgressValue(progress);
            QString word = line.section(' ', 0, 0).toUpper();
            QString definition = line.section(' ', 1);
            definitionsHash.insert(word, definition);


            QString alphagram = LexiconUtilities::alphagrammize(word, lessThan);
            if (!alphagramsHash.contains(alphagram))
                alphagramsHash.insert(alphagram, Alph(dummy, lexInfo->combinations(alphagram), alphagram));

           // qDebug() << word;
            alphagramsHash[alphagram].words << word;
          // qDebug() << "1";
            QString backHooks = lexInfo->dawg.findHooks(word.toAscii());
           // qDebug() << "2";
            QString frontHooks = lexInfo->reverseDawg.findHooks(reverse(word).toAscii());
            QString lexSymbols = "";
                              //   qDebug() << "here";
            if (alphagram == "ACEIMNT")
	      {
                qDebug() << "ACEIMNT";
                qDebug() << word.toAscii() << lexInfoAmerica->dawg.findWord(word.toAscii());

	      }
            if (updateCSWPoundSigns && lexInfoAmerica && !lexInfoAmerica->dawg.findWord(word.toAscii()))
                lexSymbols = "#";
           // qDebug() << "and here";

            //qDebug() << word << alphagram << definition << backHooks << frontHooks;
            wordQuery.bindValue(0, alphagram);
            wordQuery.bindValue(1, word);
            wordQuery.bindValue(2, definition);
            wordQuery.bindValue(3, lexSymbols);
            wordQuery.bindValue(4, frontHooks);
            wordQuery.bindValue(5, backHooks);
            wordQuery.exec();
        }
    }
    wordQuery.exec("END TRANSACTION");
    file.close();

    /* now sort alphagramsHash by probability/length */
    qDebug() << lexiconName.toAscii().constData() << ": Sorting by probability...";
    QList <Alph> alphs = alphagramsHash.values();
    qSort(alphs.begin(), alphs.end(), probLessThan);

    qDebug() << lexiconName.toAscii().constData() << ": Creating alphagrams...";

    queryText = "INSERT INTO alphagrams(alphagram, words, probability, length, num_vowels) VALUES(?, ?, ?, ?, ?)";
    wordQuery.exec("BEGIN TRANSACTION");
    wordQuery.prepare(queryText);
    int probs[16];
    for (int i = 0; i < 16; i++)
        probs[i] = 0;
    for (int i = 0; i < alphs.size(); i++)
    {
        wordQuery.bindValue(0, alphs[i].alphagram);
        int wordLength = alphs[i].alphagram.length();
        wordQuery.bindValue(1, alphs[i].words.join(" "));

        progress++;
        if (progress%1000 == 0)
            emit setProgressValue(progress); // this is gonna be a little behind because of alphagrams.. it's ok

        if (wordLength <= 15)
            probs[wordLength]++;

        wordQuery.bindValue(2, LexiconUtilities::encodeProbIndex(probs[wordLength], wordLength));
        wordQuery.bindValue(3, wordLength);
        wordQuery.bindValue(4, alphs[i].alphagram.count(QChar('A')) +  alphs[i].alphagram.count(QChar('E')) +
                            alphs[i].alphagram.count(QChar('I')) +  alphs[i].alphagram.count(QChar('O')) +
                            alphs[i].alphagram.count(QChar('U')));
        wordQuery.exec();
    }

    wordQuery.exec("END TRANSACTION");

    qDebug() << "Created alphas in" << time.elapsed() << "for lexicon" << lexiconName;

    qDebug() << lexiconName.toAscii().constData() << ": updating definitions...";
    wordQuery.exec("CREATE UNIQUE INDEX word_index on words(word)");
    /* update definitions */


    updateDefinitions(definitionsHash, progress, db);



    qDebug() << lexiconName.toAscii().constData() << ": Indexing database...";


    // do this indexing at the end.
    //    wordQuery.exec("CREATE UNIQUE INDEX probability_index on alphagrams(probability)");
    wordQuery.exec("CREATE UNIQUE INDEX alphagram_index on alphagrams(alphagram)");

    wordQuery.prepare("INSERT INTO lengthcounts(length, numalphagrams) VALUES(?, ?)");
    for (int i = 2; i <= 15; i++)
    {
        wordQuery.addBindValue(i);
        wordQuery.addBindValue(probs[i]);
        wordQuery.exec();
    }

    qDebug() << lexiconName.toAscii().constData() << ": Creating special lists...";

    wordQuery.exec("BEGIN TRANSACTION");

    QString vowelQueryString = "SELECT probability from alphagrams where length = %1 and num_vowels = %2";
    sqlListMaker(vowelQueryString.arg(8).arg(5), QString("Five-vowel-8s"), 8, db);
    sqlListMaker(vowelQueryString.arg(7).arg(4), QString("Four-vowel-7s"), 7, db);
    QString jqxzQueryString = "SELECT probability from alphagrams where length = %1 and "
                              "(alphagram like '%Q%' or alphagram like '%J%' or alphagram like '%X%' or alphagram like '%Z%')";

    for (int i = 4; i <= 8; i++)
        sqlListMaker(jqxzQueryString.arg(i), QString("JQXZ %1s").arg(i), i, db);

    if (lexiconName == "CSW07")
    {
        QString newWordsQueryString = "SELECT alphagram from words where length(alphagram) = %1 and "
                                      "lexiconstrings like '%#%'";
        for (int i = 7; i <= 8; i++)
            sqlListMaker(newWordsQueryString.arg(i), QString("CSW07-only %1s").arg(i), i, db, ALPHAGRAM_QUERY);
    }

    wordQuery.exec("END TRANSACTION");


    qDebug() << lexiconName.toAscii().constData() << ": Database created!";
    emit setProgressValue(0);

}

void DatabaseCreator::sqlListMaker(QString queryString, QString listName, quint8 wordLength,
                                   QSqlDatabase& db, SqlListMakerQueryTypes queryType)
{

    QSqlQuery wordQuery(db);
    wordQuery.exec(queryString);
    QVector <quint32> probIndices;
    if (queryType == PROBABILITY_QUERY)
    {
        while (wordQuery.next())
        {
            probIndices.append(wordQuery.value(0).toInt());
        }
        qDebug() << listName << "found" << probIndices.size();
        if (probIndices.size() == 0) return;
    }
    else if (queryType == ALPHAGRAM_QUERY)
    {
        QStringList alphagrams;
        while (wordQuery.next())
        {
            alphagrams.append(wordQuery.value(0).toString());
        }
        /* has a list of all the alphagrams */
        if (alphagrams.size() == 0) return;
        foreach (QString alpha, alphagrams)
        {
            wordQuery.exec("SELECT probability from alphagrams where alphagram = '" + alpha + "'");

            while (wordQuery.next())
            {
                probIndices.append(wordQuery.value(0).toInt());
            }

        }

    }
    QByteArray ba;
    QDataStream baWriter(&ba, QIODevice::WriteOnly);

    baWriter << (quint8)1 << (quint8)wordLength << (quint32)probIndices.size();

    // (quint8)1 means this is a LIST of indices
    // second param is word length.
    // third param is number of indices
    foreach(quint32 index, probIndices)
        baWriter << index;

    QString toExecute = "INSERT INTO wordlists(listname, numalphagrams, probindices) "
                        "VALUES(?,?,?)";
    wordQuery.prepare(toExecute);
    wordQuery.bindValue(0, listName);
    wordQuery.bindValue(1, probIndices.size());
    wordQuery.bindValue(2, ba);
    wordQuery.exec();


}

void DatabaseCreator::updateDefinitions(QHash<QString, QString>& defHash, int progress, QSqlDatabase &db)
{
    QSqlQuery wordQuery(db);
    wordQuery.exec("BEGIN TRANSACTION");
    wordQuery.prepare("UPDATE words SET definition = ? WHERE word = ?");

    QHashIterator<QString, QString> hashIterator(defHash);
    while (hashIterator.hasNext())
    {
        progress++;
        if (progress%1000 == 0)
            emit setProgressValue(progress);

        hashIterator.next();
        QString word = hashIterator.key();
        QString definition = hashIterator.value();
        QStringList defs = definition.split(" / ");
        QString newDefinition;
        foreach (QString def, defs)
        {
            if (!newDefinition.isEmpty())
                newDefinition += "\n";
            newDefinition += followDefinitionLinks(def, defHash, false, 3);
        }

        if (definition != newDefinition)
        {
            wordQuery.bindValue(0, newDefinition);
            wordQuery.bindValue(1, word);
            wordQuery.exec();
        }

    }
    wordQuery.exec("END TRANSACTION");

}

QString DatabaseCreator::followDefinitionLinks(QString definition, QHash<QString, QString>& defHash, bool useFollow, int maxDepth)
{
    /* this code is basically taken from Michael Thelen's CreateDatabaseThread.cpp, part of Zyzzyva, which is
       GPLed software, source code available at http://www.zyzzyva.net, copyright Michael Thelen. */
    QRegExp followRegex (QString("\\{(\\w+)=(\\w+)\\}"));
    QRegExp replaceRegex (QString("\\<(\\w+)=(\\w+)\\>"));

    // Try to match the follow regex and the replace regex.  If a follow regex
    // is ever matched, then the "follow" replacements should always be used,
    // even if the "replace" regex is matched in a later iteration.
    QRegExp* matchedRegex = 0;

    int index = followRegex.indexIn(definition, 0);
    if (index >= 0) {
        matchedRegex = &followRegex;
        useFollow = true;
    }
    else {
        index = replaceRegex.indexIn(definition, 0);
        matchedRegex = &replaceRegex;
    }

    if (index < 0)
        return definition;

    QString modified (definition);
    QString word = matchedRegex->cap(1);
    QString pos = matchedRegex->cap(2);

    QString replacement;
    QString upper = word.toUpper();
    QString failReplacement = useFollow ? word : upper;
    if (!maxDepth)
    {
        replacement = failReplacement;
    }
    else
    {
        QString subdef = getSubDefinition(upper, pos, defHash);
        if (subdef.isEmpty())
        {
            replacement = failReplacement;
        }
        else if (useFollow)
        {
            replacement = (matchedRegex == &followRegex) ?
                word + " (" + subdef + ")" : subdef;
        }
        else
        {
            replacement = upper + ", " + subdef;
        }
    }

    modified.replace(index, matchedRegex->matchedLength(), replacement);
    int lowerMaxDepth = useFollow ? maxDepth - 1 : maxDepth;
    QString newDefinition = maxDepth
        ? followDefinitionLinks(modified, defHash, useFollow, lowerMaxDepth)
            : modified;
    return newDefinition;
}

QString DatabaseCreator::getSubDefinition(const QString& word, const QString& pos, QHash<QString, QString>& defHash)
{
    if (!defHash.contains(word))
        return QString();

    QString definition = defHash[word];
    QRegExp posRegex (QString("\\[(\\w+)"));
    QStringList defs = definition.split(" / ");
    foreach (QString def, defs)
    {
        if ((posRegex.indexIn(def, 0) > 0) &&
            (posRegex.cap(1) == pos))
        {
            QString str = def.left(def.indexOf("[")).simplified();
            if (!str.isEmpty())
                return str;
        }
    }

    return QString();
}


