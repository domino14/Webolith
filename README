Aerolith 2.0 is a word study website.

=======

This repository holds the Python, Javascript, and C++ code required to serve Aerolith on a fresh machine. Here's
a brief description of the different modules:

###Python

The bulk of the back-end code is written in Python 2.x, using Django 1.3. 

###Javascript

Front-end code is in Javascript and regular CSS. Nothing fancy yet. I've littered the namespace with globals because I'm
kind of a JS newb, but I'll probably clean up the code when I have time.

###C++

The C++ code, in the dbCreator folder, is used to generate the database files needed to run the program. It actually
produces big CSV files for the words, alphagrams, and lexica, that can then be loaded into MySQL with the 'loaddata' 
command. There's also a makedawg.py file in there that makes the DAWG (it's actually a Trie because I got lazy) needed
for the dbCreator to find the hooks properly. So that needs to be run first. More details on the Wiki 
[https://github.com/domino14/Webolith/wiki/Adding-a-new-lexicon](https://github.com/domino14/Webolith/wiki/Adding-a-new-lexicon).

The code needs Qt ~4.7 (earlier will probably work up to a limit) to be compiled. The code looks more complex than
it actually is. It's actually part of the original Aerolith C++ program; I've modified it a bit. I will probably
simplify it and/or rewrite it in Python sometime in the future, at least to keep consistency.

The files this dbCreator generates also need to be added to Redis. This can be done with python manage.py loadWordsIntoRedis.
I use Redis for checking uploaded word lists at the moment; its scope will probably significantly expand as Redis is awesome.