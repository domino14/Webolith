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

    alphFile.setFileName("alphs.txt");
    wordFile.setFileName("words.txt");
    lexFile.setFileName("lex.txt");

    alphFile.open(QIODevice::WriteOnly);
    wordFile.open(QIODevice::WriteOnly);
    lexFile.open(QIODevice::WriteOnly);

    alphStream.setDevice(&alphFile);
    wordStream.setDevice(&wordFile);
    lexStream.setDevice(&lexFile);

    this->lexiconMap = lexiconMap;
    qDebug() << "In db creator";
    wordIndex = 1;

}

DatabaseCreator::~DatabaseCreator()
{
    alphFile.close();
    wordFile.close();
    lexFile.close();
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
    lexInfo->resetLetterDistributionVariables();
    qDebug() << lexiconName.toAscii().constData() << ": Reading in dictionary.";

    QHash <QString, Alph> alphagramsHash;

    QFile file(Utilities::getRootDir() + "/words/" + lexInfo->wordsFilename);
    if (!file.open(QIODevice::ReadOnly)) return;

    LessThans lessThan;
    if (lexInfo->lexiconName == "FISE") lessThan = SPANISH_LESS_THAN;
    else lessThan = ENGLISH_LESS_THAN;

    bool updateCSWPoundSigns = (lexiconName == "CSW07");
    /* update lexicon symbols if this is CSW (compare to OWL2)*/
    LexiconInfo* lexInfoAmerica = &(lexiconMap->map["OWL2"]);


    QTextStream in(&file);
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

            alphagramsHash[alphagram].words << word;

        }
    }

    /* now sort alphagramsHash by probability/length */
    qDebug() << lexiconName.toAscii().constData() << ": Sorting by probability...";
    QList <Alph> alphs = alphagramsHash.values();
    qSort(alphs.begin(), alphs.end(), probLessThan);

    qDebug() << lexiconName.toAscii().constData() << ": Creating alphagrams...";

    updateDefinitions(definitionsHash, progress);
    int probs[16];
    for (int i = 0; i < 16; i++)
        probs[i] = 0;
    int lexIndex = lexInfo->lexiconIndex;
    for (int i = 0; i < alphs.size(); i++)
    {
        int wordLength = alphs[i].alphagram.length();

        progress++;
        if (progress%1000 == 0)
            emit setProgressValue(progress); // this is gonna be a little behind because of alphagrams.. it's ok

        if (wordLength <= 15)
            probs[wordLength]++;
        
        int encodedProb = LexiconUtilities::encodeProbIndex(probs[wordLength], wordLength, lexIndex);
        alphStream << alphs[i].alphagram << ","
                << lexIndex << ","
                << probs[wordLength] << ","
                << encodedProb << ","
                << wordLength << endl;
        for (int j = 0; j < alphs[i].words.length(); j++)
        {
            QString word = alphs[i].words[j];
            QString backHooks = lexInfo->dawg.findHooks(word.toAscii());
            QString frontHooks = lexInfo->reverseDawg.findHooks(reverse(word).toAscii());
            QString lexSymbols = "";
            if (updateCSWPoundSigns && lexInfoAmerica && !lexInfoAmerica->dawg.findWord(word.toAscii()))
                lexSymbols = "#";
            wordStream << wordIndex << "," << alphs[i].words[j] << "," << encodedProb << ","
                        << lexIndex << "," << lexSymbols << "," << escapeStr(definitionsHash[word]) << ","
                        << frontHooks << "," << backHooks << endl;    
            wordIndex++;
        }
    }

    lexStream <<   lexIndex << "," <<   lexInfo->lexiconName << "," << escapeStr(lexInfo->descriptiveName)
            << "," << escapeStr(stringifyArray(probs)) << endl;

    qDebug() << "Created text files in" << time.elapsed() << "for lexicon" << lexiconName;


    emit setProgressValue(0);

}

QString DatabaseCreator::escapeStr(QString str)
{
    /* escapes string suitable for loading into SQL database*/
    str.replace(",", "\\,");
    str.replace("\n", "\\\n");
    return str;
}

QString DatabaseCreator::stringifyArray(int* probs)
{
    QString ret = "{";
    for (int i = 2; i < 16; i++)
    {
        ret += "\"" + QString::number(i) + "\":" + QString::number(probs[i]);
        if (i != 15) ret += ",";
    }
    ret+= "}";
    return ret;
}

/*


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
        // has a list of all the alphagrams
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


}*/

void DatabaseCreator::updateDefinitions(QHash<QString, QString>& defHash, int progress)
{
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
            defHash[word] = newDefinition;
    }

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


