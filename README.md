Aerolith 2.0 is a word study website - Copyright 2007-2016 César Del Solar

Build status: [![CircleCI](https://circleci.com/gh/domino14/Webolith.svg?style=svg&circle-token=63b1498e4c366aff7052ee02d1e4cf59075e235d)](https://circleci.com/gh/domino14/Webolith)

=======

This repository holds the Python and Javascript required to serve Aerolith on a fresh machine. Here's a brief description of the different modules:

### Python

The bulk of the back-end code is written in Python 2.7, using Django 1.8.x.

### Javascript

Front-end code is Javascript (ES5 mostly), using Backbone, Underscore, and RequireJS.

### word_db_maker

The word databases are SQLITE, and [word_db_maker](https://github.com/domino14/word_db_maker) is a Go 1.5 program that will make them.

See more information at that program. They require GADDAGs for the different lexica ([gaddag](https://github.com/domino14/macondo/tree/master/gaddag)). Kind of convoluted but this is better than the previous way which required Qt and C++.

=======

## Getting started with Docker

On my dev machine I installed docker - make sure it comes with docker-machine,
VirtualBox, docker-compose ... the main package on the docker site should
have these.

`config/local_config_skeleton.env` should be filled in with appropriate values
and renamed to `config/local_config.env`. 

The `./db` directory needs the lexicon .db files made by `word_db_maker` above.
Make sure to generate these first and place them in the `./db` directory.
The `docker-compose` file will mount the `./db` directory here for use by the
app.

Then, running `./setup.sh` in this directory should set everything up, hopefully.

Note: you may need to restart app after the initial `docker-compose up -d`...
`docker-compose restart app`. This is because it tries to connect to a
database that doesn't exist yet since everything restarts at once.
(Gotta figure out how to sync it).

You can access the app in your browser at the ip:8000 (get ip with 
something like  `docker-machine ip default`, depending on your settings.)

=======

Blank challenge generation is done with [macondo](https://github.com/domino14/macondo/tree/master/anagrammer/blank_challenges.go).

