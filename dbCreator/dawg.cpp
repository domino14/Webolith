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


#include "dawg.h"

Dawg::Dawg()
{
}

void Dawg::readDawg(QString filename)
{
    /* reads a dawg that was created with my makedawg.py script    */
    nodes.clear();
    QFile file(filename);
    if (!file.open(QIODevice::ReadOnly)) return;
    QDataStream in(&file);
    QVector <quint32> ints;
    while (!in.atEnd())
    {
        quint32 integer;
        in >> integer;
        ints.append(integer);
    }
    file.close();
    qDebug() << ints.size() << "nodes read from " << filename;
    bool endOfNext;
    QChar letter;
    bool endOfWord;
    int child, sibling;
    for (int i = 0; i < ints.size(); i++)
    {

        unsigned char byte0 = (ints[i]) & 255;
        unsigned char letterCode = byte0 & 63;
        if (letterCode <= 25) letter = QChar('A' + letterCode);
        else if (letterCode >= 26 && letterCode <= 28) letter = QChar(letterCode + '1' - 26);
        else if (letterCode == 29) letter = QChar(0xD1);    // todo fix
        else letter = NULL_LETTER;
        if ( ((byte0 >> 7) & 1) == 1) endOfWord = true;
        else endOfWord = false;
        if ( ((byte0 >> 6) & 1) == 1) endOfNext = true;
        else endOfNext = false;
        child = ints[i] >> 8;
        if (child == 0) child = NULL_NODE;
        if (endOfNext)
            sibling = NULL_NODE;
        else
            sibling = i + 1;

        nodes.append(DawgNode(letter, endOfWord, child, sibling));

    }

}

bool Dawg::findWord(QString wordToFind)
{
    int index = findPartialWord(wordToFind);
    if (index == NULL_NODE) return false;
    else return nodes.at(index).endOfWord;
}

int Dawg::findPartialWord(QString wordToFind)
{
    int a;
    int wordlength;
    bool letterfound;
    int curindex = 0;
    wordlength = wordToFind.length();
    QChar thisletter;
    for (a = 0; a < wordlength; a++)
    {

        thisletter = wordToFind[a].toUpper();
        //qDebug() << "This letter" << thisletter << nodes.size() << curindex;
        letterfound = false;
        if (nodes.at(curindex).letter != NULL_LETTER && nodes.at(curindex).letter == thisletter)
        {
           // qDebug() << "1";
            letterfound = true;

        }
        while(!letterfound)
        {
            curindex = nodes.at(curindex).sibling;
        //    qDebug() << "2" << curindex;
            if (curindex == NULL_NODE) break;
            letterfound = (nodes.at(curindex).letter == thisletter);
        }
        if (!letterfound) return NULL_NODE;
        if (a != wordlength - 1)
        {
        //    qDebug() << "3";
            curindex = nodes.at(curindex).child;
            if (curindex == NULL_NODE) break;
        }
    }
    return curindex;
}


void Dawg::printDawg()
{
    qDebug() << "\tletter\tchild\tsibling\teow";
    for (int i = 0; i < nodes.size(); i++)
        qDebug() << i << ":\t"<< nodes[i].letter << "\t" <<
                nodes[i].child << "\t" << nodes[i].sibling << "\t" <<
                nodes[i].endOfWord;

}

QString Dawg::findHooks(QString word)
{
    QString hooks;
    int node = findPartialWord(word);

    if (node != NULL_NODE)
    {
        /* traverse thru children*/
        int child = nodes.at(node).child;
        if (child == NULL_NODE) return hooks;
        if (child != NULL_NODE && nodes.at(child).endOfWord)
        {
            hooks += nodes.at(child).letter;
        }

        int nextsibling = nodes.at(child).sibling;
        //qDebug() << "fail4";
        while (nextsibling != NULL_NODE)
        {
            if (nodes.at(nextsibling).endOfWord)
            {
                hooks += nodes.at(nextsibling).letter;
            }
            nextsibling = nodes.at(nextsibling).sibling;
        }


    }
    return hooks;

}

void Dawg::checkDawg(QString wordList)
{
    qDebug() << "In checkdawg";
    QFile file(wordList);
    if (!file.open(QIODevice::ReadOnly))
    {
        qDebug() << "Could not open" << wordList << "for reading";
        return;
    }

    QTextStream in(&file);
    qDebug() << "Codec name: " << in.codec()->name();
    while (!in.atEnd())
    {
        QString line = in.readLine();
        QStringList words = line.split(' ');
        if (line.length() > 1 && !findWord(words[0]))
        {
            qDebug() << words[0] << "not found!";
            for (int i = 0; i < words[0].size(); i++)
            {
                qDebug() << words[0][i].unicode();
            }
        }
    }
    file.close();
    qDebug() << "Checked every word in" << wordList;
}
