Planned approach to multiplayer.

## Overview

Use Go + gorilla websockets. 

Basically, re-implement some of `wordwalls/game.py` in Go. In the main table creation page, clicking Play should redirect to a view that would be handled by a Go server.

Right now, we have form submit handlers in `wordwalls/views.py` which essentially initialize a WordwallsGame and a WordList. This behavior will need to change:


