Aerolith 2.0 is a word study website - Copyright 2007-2016 César Del Solar

Build status: [![CircleCI](https://circleci.com/gh/domino14/Webolith.svg?style=svg&circle-token=63b1498e4c366aff7052ee02d1e4cf59075e235d)](https://circleci.com/gh/domino14/Webolith)

=======

This repository holds the Python and Javascript required to serve Aerolith on a fresh machine. Here's a brief description of the different modules:

### Python

The bulk of the back-end code is written in Python 3, using Django 1.11.x.

### Javascript

Front-end code for Wordwalls is Javascript (ES6 mostly), using React. The rest of the app is moving to React as well.

Javascript code uses the Airbnb eslint config. (See their style guide: https://github.com/airbnb/javascript/)
If you wish to contribute, please use this same config in your code editor, as code will not deploy without passing this first linting step.

### Macondo

Macondo is at https://github.com/domino14/macondo.

It is used to generate the build challenges and blank challenges, as well as other ancillary word-related stuff.

See [blank_challenges.go](https://github.com/domino14/macondo/tree/master/anagrammer/blank_challenges.go).

=======

## Getting started with Docker

See https://github.com/domino14/aerolith-infra

