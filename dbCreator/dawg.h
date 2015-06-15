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

#ifndef DAWG_H
#define DAWG_H

#include <QtCore>

#define NULL_LETTER 0
#define NULL_NODE -1

struct DawgNode
{
    QChar letter;
    int child;
    int sibling;
    bool endOfWord;
    DawgNode(QChar let, bool eow, int c, int s)
    {
        letter = let; endOfWord = eow; child = c; sibling = s;
    }
    DawgNode()
    {
    }
};


class Dawg
{
public:
    Dawg();
    void readDawg(QString filename);
    void printDawg();
    bool findWord(QString wordToFind);
    void checkDawg(QString wordlist);
    int findPartialWord(QString wordToFind);
    QPair<bool, QString> findHooks(QString word);
private:
    QVector <DawgNode> nodes;
};

#endif // DAWG_H
