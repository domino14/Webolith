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
        -[x] guess
        -[ ] start
----

Presence is tough and has lots of edge cases.
- we should store presence info in the DB.
- Presence table
    + Used for showing chat widget of users on first load of lobby
- wordwalls inTable column
    + Used for showing who's in each game in the lobby view
Can we combine these?

- if we just use presence table
    + getting who's in each table is a slightly more complex query
    + we have to call this query when users join a table to give user most recent presences in that table, and also periodically from the lobby to update active users in all tables.
    + whenever someone leaves or joins a table, this should create its own event so this is probably ok. the periodic lobby message should be somehow debounced on the backend so it only sends once a minute or so, no matter how often it's requested. (perhaps cached)
    + 
- just using inTable is hard because then the lobby sort of needs to be a table.

tentative solution: get rid of inTable and just use Presences table. For the most part we will not have lag and things will be fine.
