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
    -[ ] click to show solutions? (if users were in the middle of typing)
-[x] submit guess if not solved locally
-[x] end game properly when all words solved/time runs out
    - [x] start at end of game should not start timer/show giveup button.
-[x] save behavior
    - [x] save at the very end of a round if the user forgot to click autosave
-[x] exit table
    -[ ] exit behavior (auto give up if quiz going, etc.)
-[x] visual rearrangement

-[ ] daily challenge results
-[ ] optimization (don't handle unseen elements, etc)
    - [ ] check on slower computers (my old macbook)
-[x] autofocus guess on start
-[ ] tests
-[ ] compilation/deployment on dev
-[ ] Search for XXX/TODO/etc.


Nice to haves:
-[ ] on hover things
    - show alphagrams solved, number of alphagrams, etc
    - show definitions for words.
    - (how do we get tooltips to work?)
-[ ] as user types, dim tiles


(Can release part 1)

For multiplayer
-[ ] More player boxes (only show on bigger screens?)
-[ ] Chat submit box
-[ ] Hijack tab key to change between guess/chat
-[ ] All the relevant multiplayer logic