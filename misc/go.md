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

## First steps

Need to split up the Wordwalls app into pieces, then replace those systematically with the Go equivalents. 

#### Flow currently:

- Two main views - the "main" wordwalls table creation view, and the wordwalls
table view.
- In the table creation view, we listen for form submits. Users can submit 4 different forms: challenge, named list, saved list, and probability search
    + Form submission isn't quite standard; it's an AJAX POST, with the parameters form-encoded; see e.g. `savedListsSubmitClicked` in `tableCreate.js`. All post to the same URL.
    + Inside each form submission handler, we validate the Django form and initialize a WordwallsGame. The initialization routine in WordwallsGame will initialize a `wordwalls.models.WordwallsGameModel` instance, setting up the word list for it, and then actually save it to the database.
    + The database ID is sent back to the front-end AJAX handler.
    + The front-end redirects to /wordwalls/table/{id}
- In the table id view, for every path (POST or GET) we are creating a WordwallsGame every time, which then accesses the `WordwallsGameModel` instance given the id. 
- Game start and play causes lots of changes to `WordwallsGameModel.state`, which is a JSON blob. 

Things that are bad:
- Too much "state". We should not be creating a WordwallsGame every time we do anything, and then accessing an instance of something in the db for literally almost any request. 
- The `state` param in particular is heavily used.
- Magic giant views instead of an API.

#### Ideal flow (all Python):

The ideal flow would include Go and use Redis / etc for state handling. Since that's the final step, we will come up with an intermediate that still uses Python for everything, then try to swap out the gameplay parts with Go.

- Submission handler initializes a WordwallsState or similar. WordwallsGame should be a set of helper functions that deal with the state.
- Persistence of WordwallsState is in Redis. An API should be written for this part. Not an HTTP API, just a set of simple functions that can later be duplicated in Go.
- Submission handler will also initialize the temporary Word List.
- A Word List API should be written; this one should have an HTTP interface. Before moving to Go, we should still talk to it through the regular Python function interface. Go would then talk to the API through the HTTP interface:
    + Simple update/delete/etc
    + Get next X questions, advance question pointer
    + Can probably mostly reuse the API we wrote for `flashcards` 

### Another flow

In the interest of time, and because I don't want to spend all of the limited time I have working on adding multiplayer, but rather want to focus on making a new ISC, we need an approach that allows us to keep the vast majority of the code in Python.

Basically,
    1. Go socket handler is JUST for sockets. Should try to have minimal game logic in Go.
    2. Game state will need to be moved _away_ from the database for concurrency reasons.

#### Details:

- Submission handler still initializes a WordwallsGame. Game Model and associated word list are saved to the database.
- Redirect to table.
- In table view, front end connects to a Socket.
- Go socket handler does the following:
    + Validate username, timestamp, etc with a crypto signature
    + Let user in, keep track of other users in this table. A "room" is created for every table id. (Pretty simple)
    + Since every user needs a signature to get in, it's pretty simple to maintain who has access to what tables. We will pretty much allow anyone to join any table unless it's marked private / do not join. Tables will be started in private mode. The Django part of this can handle this. Socket only validates signatures and lets people into rooms.

Responsibilities:
    - Start game. This is sent to the Socket server. Socket server will request LIST and STATE (in particular, the most important thing here is the answerHash) information from Django for this particular run of the game. The game view will be similar, except it's listening to the socket server, not a player. While waiting we can show a spinner or countdown (should still be really quick).
        + Socket will respond some time later with the questions, answers, etc, which the client can update into its backend.
    - Guess. This is sent to the socket server. 
        + Server will check its state representation, update the answer hash, and send some response back, whether we accepted the answer or not, who answered it, etc.
    - Give up
        + Send to socket, socket sends back to game view after updating its current state representation.
    - Save
        + Send to Django. Django will save the list. We need to revisit the current save name nonsense, it can be reworked.
    - Preferences
        + Django
    - Solutions
        + All front-end
    - Exit
        + Django, but if we want to be nice we can also send a disconnect to the socket server
    - Timer
        + Timing will be done in JS on the front end with maybe sync pulses from the socket server. Or it can all be done in the socket server but this is kind of expensive bandwidth wise (minimally).
        + Socket server will keep track of time passed to determine whether a guess is valid or the game is over or whatever.
        + Socket server will send a "game over" pulse (this can be removed from the front end)

All other responsibilities, around saving lists, loading lists, creating different types of challenges, word searching (any word-related stuff) etc etc will all be handled in Django.
    - When a round is over, socket server will post to Django with the results, and Django will know to mark plays missed, advance the list, etc etc.

Basically, socket server has two responsibilities:
    - Keep track of state (this will involve some minimal game logic). State can be either in Redis or in memory (with channel-locked map access). If it's in memory we'll have a hard time rebooting without losing info, but even then we can do some trickery with interrupts and dumping the contents of memory. Maybe we don't even need Redis! (Unless the external service completely dies, in which case we lose the current info of any on-going games. C'est la vie.)
        + As specified above, this will involve some communication with the Django server through a small set of hopefully simple and testable APIs.
    - The real time communications / keeping track of connections / rooms / etc.