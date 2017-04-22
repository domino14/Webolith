To make the transition as simple as possible, we're going to use Django Channels to power the multiplayer mode.

First move all the interaction code (guesses, start, etc) to use Channels:

- start  -- move, since this will require broadcast to everyone else, and possibly no db persistence?
- guess -- definitely move 
- gameEnded -- probably can get rid of this, as server will tell client when game ends
- giveUp -- will require broadcast, but probably should not be allowed in multiplayer mode. keep in API probably.
- save -- will probably not be in multiplayer mode. Keep in API.
- giveUpAndSave -- keep in API
- savePrefs  -- keep in API
- getDcData  -- keep in API


----

start, guess are only ones, + new chat

[ ] - Move start and guess to Channels for single-player mode
