Desired software architecture for Aerolith.

============

Flashcards / Wordwalls / others should share several things.

### Backend

- Can make some Django forms just for the validation logic, probably, but rendering them is problematic as we probably want to use front-end templates, etc.
- Word Lists should be moved to base as several games will use this idea. I'm not a big fan of the idea of "first missed" though. Why not second missed, etc? It may be better to have the idea of making a brand new quiz from a list of missed words, it is more flexible and probably better for the end user in terms of organization and comprehension.
- Maybe the backend for WordWalls should not handle every single guess, but rather get a POST at the end of a quiz with missed/correct/etc questions. This however makes it trivial to cheat and submit a great score, although not much harder than just writing a cheat bot that submits all the answers -- this is an interesting dilemma.
- Maybe wordwalls should be converted to Nodejs/Sock.js as it will help with real-time, especially with multiplayer. States should not be constantly loaded and saved with JSON to a relational database; instead they should be stored in memory in a nodejs app (of course if the app crashes we lose this temporary memory state). Then word list progress etc can be saved to the db.

### Front end

- The wordwalls app should probably be totally rewritten as a single-page app, so users can do everything from one page, load new word lists, invite players, etc.
- In either case wordwalls can share some models with flashcards:
    - Flashcards for example will have a word_list.js model. It can be used to mirror the back end word list.
    - word_list.js should not know anything about the individual representation of questions though, so nothing about cards.

#### Flashcards js

- app.js, quiz.js