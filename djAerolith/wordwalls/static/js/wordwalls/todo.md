-[x] 4 x 12 instead of 5 x 10
~~-[ ] color legend~~
-[x] game colored chips
-[x] make divs scroll down properly on addition of info.
-[x] click questions to shuffle
-[x] preferences (handle no tiles case gracefully, etc)
-[x] preferences (save)
    - ~~[wontfix] inserting into custom tile order moves cursor to the end
        (won't fix for now)~~
-[x] preferences dialog
    - [x] hide lexicon symbols
    - [x] close on save
    - [x] reset on close
-[x] make tiles smaller for longer words
-[x] spanish digraph tiles
    - [x] guess/display logic
~~-[ ] i18n
    - This is difficult. https://github.com/yahoo/react-intl is a good package but I'd need to move to nodejs/babel/es6/etc and change a lot of stuff. I may temporarily remove i18n since there's only one Spanish user.~~
-[x] shuffle/alpha/etc
-[x] solutions
    -[x] mark missed
-[x] submit guess if not solved locally
-[x] end game properly when all words solved/time runs out
    - [x] start at end of game should not start timer/show giveup button.
-[x] save behavior
    - [x] save at the very end of a round if the user forgot to click autosave
-[x] exit table
    -[x] exit behavior (auto give up if quiz going, etc.)
-[x] visual rearrangement
-[x] FIREFOX SUCKS
    - [x] Tiles not centering
    - [x] Backspace should not go back
-[x] > 100% solved sometimes (35/31 ?)
    happens when you click start after going through a set of questions
-[x] daily challenge results
-[x] guess error behavior
-[x] compilation/deployment on dev
    - [x] webpack, etc. require doesn't seem to work (maybe that's good and will force me to figure it out)
    - [x] Probably turn everything into ES6 / remove require... ;(
-[x] optimization (don't handle unseen elements, etc)
    - [x] check on slower computers (my old macbook) --- it's pretty fast on Chromebits!
-[x] autofocus guess on start
-[x] Search for XXX/TODO/etc.
-[x] ran out of time too early bug :(
    -  Pretty sure this has to do with bringing computer back from sleep and
    starting game too soon afterwards.
-[x] tests (this one can be neverending, but some tests are ok, can always add more)
    - need to learn React tests.
Minor tweaks:
-[x] Disable start briefly after pressing start.
-[x] click to show solutions? (if users were in the middle of typing)~~
-[x] Move X button somewhere nicer, maybe move a couple other things
    - [x] autosave, list display length, etc.
-[x] Use bootstrap icons instead of font awesome.
-[x] As window shrinks UserBox should disappear or move elsewhere.

Nice to haves:

    - need to learn how to write front end tests.
-[ ] on hover things
    - show alphagrams solved, number of alphagrams, etc
    - show definitions for words.
    - (how do we get tooltips to work?)
-[ ] as user types, dim tiles


(Can release part 1)

Single-Page App:
-[x] Lots of stuff
-[x] Dropzone
-[x] Save limits
    - [x] Test that they still work (hey it's my moneymaker)
-[x] Deleting word list should not invalidate table.
    - [ ] Will require a migration prior to deploy.
-[x] Flashcard link (use old flashcard app for now in new page)
-[x] Get rid of all old app code, move reactapp
    - [x] Quickly look through for features we may have forgotten.
    - [x] Disable first missed options if list not complete.
    - [x] Add license text for csw
    - [x] Add spinners when waiting for stuff (We riding spinnas.. also, ___)
    ~~- [ ] Links for all other things! (edit profile, stats, hall of fame, etc...)~~
        - Maybe it's ok to keep these on the "main" page? - yes, let's add a back button. later on we can figure out how to add a nav bar.
-[x] Fix routes so that /wordwalls, /wordwalls/table/{x} are the same page
    - Load new table dialog based on route
    - Alternative for mobile
-~~[x] Aerolith lists out of order~~ Not an issue
-[x] Switching challenge dates while challenge is selected does not render 
correct leaderboards.
-[x] Fix some broken tests
-[x] Test old table creation endpoints on new code (what happens?)
    -[x] Infinite spinner, consider showing an error msg of some sort.
~~-[x] New table button for mobile.~~
-[x] New button should be gigantic and in hero unit.
    -[x] Should show hero unit instead of table at beginning.
-[x] Provide way to exit solutions display. Otherwise can't load a new word list once the user is done with existing list.
-[x] Change title of page once the user "Creates a table"

-[x] Fix deploy process completely (this should be a separate branch)
    -[x] use Docker images + ~~simple haproxy-based LB~~ Kubernetes :D
    -[x] fix America2016 mess

(Can release part 2)

For multiplayer
- [x] Investigate socket program / method to use. Options are: Django Channels, Go & Websockets, rewrite entire app in Elixir/Scala/etc
    - [x] Should at least write a POC with channels so that I don't discard it outright.
- ~~[ ] More player boxes (only show on bigger screens?)~~
- [x] Current player leaderboard
    - [x] Make it nicer
- [x] Chat submit box
- [x] Clean up multiplayer selection view
- [x] All the relevant multiplayer logic
    - [x] Join a table
    - [x] Presence inside a table (This will take some time to do properly)
        - [x] When a user changes room, should immediately send this to the backend so that their presence can be removed.
        - [x] Propagate presences to list of tables (this must have broken)
        - ~~[x] prune_rooms should remove empty rooms from front end too (Note - this doesn't broadcast a signal. Instead we should have logic where we don't display empty tables, or let them expire, etc. Let's not worry for now)~~
        - [x] creating a new table broadcasts the table to everyone, even if it's not a multiplayer table.
    - [x] **Turn multiplayer back into single player table**
        - This is implemented as creating a new table altogether.
    - [x] **Switch hosts seamlessly**
        - [x] If joining an empty table, should be made new host.
    - [x] **Should tables be deleted at some point?**
        - [x] Fix scripts to delete tables after a ~week. periodic prune_rooms will remove empty tables from the list. they'll come back if a user comes back to the same table. no big deal.
    - [x] **Only hosts should load new lists**
        - [x] Bug: Non-host loaded new list, but inTable still shows him as in old table (and new table). Seems like all presences for the same channel_name get updated even if we're not pinging that channel name. Refreshing causes a new channel name, and prune_presences eventually gets rid of the old presence.
    - [x] **UI confirm for two cases: load singleplayer game into multiplayer game as host, and as guest**
    - [x] Hide join button if user is already in this table
    - [x] Show current host of table
    - [x] Countdown to start game
    - [x] Test multiple clients solving all words at the same time
    - [x] What if a user is in multiple rooms in multiple tabs? 
        Everything works as expected! (?)
    - [x] Differentiate between single and multiplayer tables a bit more. Disable some elements, remove chat bar, remove guess chats, remove start delay, etc.
        - [x] Actually turn autosave off if loading a saved list into a multiplayer table
            - [x] It still saves it!! :o :(
        - [x] Remove `x solved y` chat
        - [x] Remove multiplayer leaderboard
        - [x] Countdown disappeared? bug? If we refresh, it goes away.
    - [x] **Fix bug with temporary word lists not getting deleted when replaced**
    - [x] ~~two players were in lobby. one was in a table. the one in table went to google.com. the other player in the lobby never saw him leave.~~
        ~~Issue was that we need to call prune_presences occasionally~~
- [x] Disable save in multiplayer game on front-end too
- [x] Reloading second window while first is going on, then guessing something in ifrst window, breaks wrongwordhash in second window
Testing:
- [x] Solve all words among all players and game should end properly
- [x] **Only host should start, maybe after some delay, or a quorum can be reached.**
- [x] There might be a race condition when joining a new table. There is a presence change signal, but what if it comes before the server gets the request for the table list? Also when refreshing the app when in a table!
    - [x] Yes, all sorts of race conditions. Rethink the lifecycle, don't do so many requests, etc etc.
- [x] Fix Django tests 
- ~~[ ] Kick players out? Make private? etc.~~ later...
- [x] ~~Hijack tab key to change between guess/chat, or~~ clean up chat view
    - XXX: Need to implement this carefully otherwise we get maximum stack size depth errors when opening the table creator.
    - I think best way is a single bar for both guess/chat with a mode switcher.
    - Moved the chat bar to the bottom
- [ ] Test giveUpAndSave behavior
- [ ] Test upgrade app behavior on start
Deployment:
    - [ ] Create Celery container for pruning presences/rooms periodically
        - [ ] May be ok creating a cronjob container, but need to enable this on kubernetes.
    - [ ] Create Daphne containers for workers and the socket channel handlers
    - [ ] Create Redis container for channels/asgi (and the Celery queue)

Nice to haves:
- [ ] look into Channels tests
- [ ] front end tests, etc
- [ ] "Social" aspect - number of alphagrams solved per user per day/week/etc
- [ ] Non-cooperative mode? (Solving doesn't solve for everyone)
- [ ] What breaks if sockets don't deliver messages? Channels is at-most-once delivery. Maybe it won't matter so much here but should think about robustness.