## JS Architecture
===============
js/wordwalls/

* collections
    Alphagrams.js - A collection of Alphagram
    Words.js - A collection of Word

* models
    Alphagram.js - A Alphagram containing a collection of Word and other characteristics, like probability, number of words.
    Word.js - A word, containing a word, definition, hooks, symbols, probability.
    WordwallsGame.js - The game logic
    Configure.js - a Model representing wordwalls config (like tiles, colors, backgrounds, etc.)
* templates
    All the templates for Mustache rendering
* views
    AlphagramView.js - A view of an alphagram, with or without the tiles, colors, etc.
    AppView.js - A view of the whole wordwalls app.
    ConfigureView.js - A View of the configure widget
    WordSolutionView.js - a View of the solutions at the end of a game.
* other:
    createTableMain.js and tableCreate.js - For creating the table. This should be merged all into one app. The concept of table "numbers" should be lost, at least visibly.
    main.js - for loading the main wordwalls game
    ChallengeView.js - Why isn't this in views? Probably because we don't have a combined app.

## Desired architecture
=======================
- Step 1:
    Game logic should be moved more to the client side. This would allow a few perks like offline mode, etc. Syncing could still be done at the end of every round. To allow multiplayer mode, the logic could still be on the front end, but now all the word submissions are messages of some sort.

    To make cheating a bit harder, don't pass the full word representations but instead a hash of every word back to the client. The hash could be something like 1000 hashes. This would result in a non trivial amount of work on the backend though and some blocking, so do we use Celery?

- Step 2:
    Combine table creator and game into one app. We would need to get rid of the concept of "tables" with different numbers, at least visibly. We can still have that concept on the backend to keep track of state variables, but by now we probably won't have much backend state since the game logic is mostly in the JS.