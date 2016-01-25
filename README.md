Aerolith 2.0 is a word study website - Copyright 2007-2016 Cesar Del Solar

=======

This repository holds the Python and Javascript required to serve Aerolith on a fresh machine. Here's a brief description of the different modules:

### Python

The bulk of the back-end code is written in Python 2.7, using Django 1.8.x.

### Javascript

Front-end code is Javascript (ES5 mostly), using Backbone, Underscore, and RequireJS.

### word_db_maker

The word databases are SQLITE, and [word_db_maker](https://github.com/domino14/word_db_maker) is a Go 1.5 program that will make them.

See more information at that program. They require GADDAGs for the different lexica ([gaddag](https://github.com/domino14/macondo/gaddag)). Kind of convoluted but this is better than the previous way which required Qt and C++.

=======

To generate blank challenges, there is a dependency on [Ujamaa](https://github.com/domino14/ujamaa). 
See: [code](https://github.com/domino14/ujamaa/blob/v0.0.3/src/anagrammer/gen_blank_challenges.c)

Hopefully this will move to Go as well at some point.