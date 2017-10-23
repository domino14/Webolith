Sometimes a user has to guess a word twice in order to be marked correct. There are two things going on here:

- `lastGuessCorrectness` defaults to true until it is set by `handleGuessResponse`. We should fix the lastGuess behavior
- The backend got the data but the front-end did not get the back-end's command to mark it correct (so `handleGuessResponse` possibly did not get called). The frontend should try confirming that the back-end got the response, or viceversa.

Searching for `event=guess-not-correct` in the logs shows a surprising number of hits. This is unfortunate, and possibly indicates something else is going on.

```
{"log":"INFO 2017-10-16 11:54:46,108 [socket_consumers.py::ws_message:190] Got a message from plasticene: {\"room\":\"1220671\",\"type\":\"guess\",\"contents\":{\"guess\":\"PAR\
GOES\"}}\n","stream":"stderr","time":"2017-10-16T11:54:46.109083555Z"}

{"log":"INFO 2017-10-16 11:54:49,510 [socket_consumers.py::ws_message:190] Got a message from plasticene: {\"room\":\"1220671\",\"type\":\"guess\",\"contents\":{\"guess\":\"PAR\
GOES\"}}\n","stream":"stderr","time":"2017-10-16T11:54:49.51028214Z"}
{"log":"INFO 2017-10-16 11:54:49,516 [game.py::guess:872] event=guess-not-correct guess=PARGOES\n","stream":"stderr","time":"2017-10-16T11:54:49.517223087Z"}
```

