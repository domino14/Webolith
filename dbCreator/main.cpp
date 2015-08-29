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

#include <QtCore/QCoreApplication>
#include "databasecreator.h"
#include "lexiconinfo.h"

int main(int argc, char *argv[])
{
    QCoreApplication a(argc, argv);


    if (argc < 2)
    {
        qDebug() << "usage:";
        qDebug() << "\tdbCreator lexName1 [lexName2 ...]";
        return 0;
    }

    LexiconMap lexiconMap;
    lexiconMap.createMap();

    DatabaseCreator dbCreator(&lexiconMap);
    QStringList args;
    if (argc >= 2)
    {
        for (int i = 1; i < argc; i++)
        {
            args.append(argv[i]);
        }
    }

    dbCreator.createLexiconDatabases(args);

    return 0;
}
