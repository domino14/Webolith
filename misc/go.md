Planned approach to multiplayer.

## Overview

Use Go + gorilla websockets. 

Basically, re-implement most of `wordwalls/game.py` in Go. In the main table creation page, clicking Play should redirect to a view that would be handled by a Go server.

Right now, we have form submit handlers in `wordwalls/views.py` which essentially initialize a WordwallsGame and a WordList. This behavior will need to change:

Choices:

### 1
- Submit parameters to Go handler. Go handler will be able to init new daily challenges (saving to DB in the process), continue/etc saved lists, named lists, and probability (and other) searches.
    + No more WordwallsGame. Go handler will only make word lists. The logic behind a game model should not even be in the DB, but either just in memory, or memory + Redis.
- Go handler will handle new players entering a table. Tables can be keyed by some UUID. It will also take in relevant parameters like privacy modes, initial creator, etc.

### 2
- Still use original Python code as much as possible. Create WordwallsGameModel in Python, but "Start/Give Up" and a few other buttons might submit straight to the Go code. We'd have to have the Go process take in the set of questions from the Python backend.
    + Clicking Start will tell Go to make a request from Python. Need an API.
    + e.g. GET /wordwalls/api/game/{tableid}/nextQuestions
    + Core game logic still handled by Go
- If multiple players click Start, we need a marker of some sort. Once they're all ready, we still hit the API. The readiness logic could be handled by Go, as well as how many people are in the table, etc.

### ?

2 might take shorter than 1, but it will be very messy because many parts will have different responsibilities. 1 should probably be chosen.
