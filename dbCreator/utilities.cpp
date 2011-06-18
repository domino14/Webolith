#include "utilities.h"

QString Utilities::getRootDir()
{
    // taken from Michael Thelen's Zyzzyva GPLed code, available at http://www.zyzzyva.net
    static QString rootDir;

    if (!rootDir.isEmpty())
        return rootDir;

    rootDir = qApp->applicationDirPath();
    QDir dir (rootDir);

    // Search in the application dir path first, then up directories until a
    // directory is found that contains an aerolith.top file.
    while (true) {
        if (dir.exists("aerolith.top")) {
            rootDir = dir.absolutePath();
            return rootDir;
        }
        if (!dir.cdUp())
            break;
    }

    return rootDir;
}
