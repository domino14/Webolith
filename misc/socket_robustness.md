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


==============

## Issues

### build mode has props errors (nothing to do with sockets)

### got game ended but did not actually end

```
app_1    | [2017/10/30 16:25:40] HTTP GET /static/img/wordwalls/table_noborder.png 200 [0.05, 172.20.0.1:47778]
app_1    | INFO 2017-10-30 16:25:48,309 [socket_consumers.py::ws_message:190] Got a message from CésarDelSolar: {"room":"66","type":"guess","contents":{"guess":"GAVAGES","reqId":"CésarDelSolar_g_2"}}
app_1    | INFO 2017-10-30 16:25:51,035 [socket_consumers.py::ws_message:190] Got a message from CésarDelSolar: {"room":"66","type":"giveup","contents":{}}
app_1    | INFO 2017-10-30 16:25:51,043 [game.py::do_quiz_end_actions:691] 49 missed this round, 49 missed total
app_1    | INFO 2017-10-30 16:25:51,162 [socket_consumers.py::ws_message:190] Got a message from CésarDelSolar: {"room":"66","type":"endpacket","contents":{"wrongWords":["EYEFULS","TWEEZED","FINESSE","INSURED","GRIFFES","FLAUNTS","GIBLETS","PIFFLED","LUNIEST","LUTEINS","UTENSIL","HAFIZES","BROTHEL","MOOCHER","WEBFOOT","VOCALIC","NODDIES","FLYPAST","MINTING","HODDENS","SHODDEN","STUPEFY","DEMERGE","EMERGED","BLANKIE","OVERSEE","QUASSES","BOSTONS","SILKILY","POWDERS","ELITISM","LIMIEST","LIMITES","EXUVIAE","ENJOYED","JOCKISH","BEGULFS","AVIATED","STIGMAS","ARGYLLS","BRADAWL","ECTOPIA","SOLUNAR","TAKAHES","HOLDING","YELLING","TRAVOIS","VIATORS","EREPSIN","REPINES","LACTATE","EPONYMS","WORSETS","DOGSKIN","CAIMANS","MANIACS","YTTRIUM","COUNTRY"],"totalWords":59,"appVersion":"1.0.4.0"}}
app_1    | INFO 2017-10-30 16:25:52,056 [socket_consumers.py::ws_message:190] Got a message from CésarDelSolar: {"room":"66","type":"timerEnded","contents":{}}
app_1    | INFO 2017-10-30 16:25:52,063 [game.py::check_game_ended:518] Got game ended but did not actually end: start_time=1509380740.620833 timer=270.000000 now=1509380752.063302 quizGoing=False elapsed=11.44246912
app_1    | INFO 2017-10-30 16:25:54,645 [soc
```

Not sure if the above is actually an issue that is user visible, but investigate

*Solution*: fixed, need to only send gameEnded if gameGoing is true


### Not the host of this table and other related messages

"start new list without being host of table"

This might be socket issues


### Not getting wordwall and getting a 0%, also there are X seconds left, please wait

- start a game
- don't receive wordwall socket message
- keeps going back to Start button
- refresh page
- now we get the "there are x seconds left till the quiz ends" message, as the quiz is running
- now we either refresh again or give up. either way will send a giveUp message
- when we start again, it quizzes on missed list

### frontend mismatch fe

```
{"type": "gamePayload", "contents": {"serverMsg": "Now quizzing on missed list.\r\nThese are questions 1 through 1 of 1.", "gameType": "regular", "questions": [{"a": "CEFGIOST", "p": 7004, "ws": [{"ibh": true, "d": "ECOGIFT, a donation of land to a government for ecological purposes [n]", "bh": "", "s": "+", "w": "ECOGIFTS", "fh": "", "ifh": false}], "idx": 1}], "time": 6}}

{"room":"66","type":"guess","contents":{"guess":"ECOGIFTS","reqId":"CésarDelSolar_g_6"}}

{"type": "gameOver", "contents": {"room": "66"}}

{"room":"66","type":"endpacket","contents":{"wrongWords":["ECOGIFTS"],"totalWords":1,"appVersion":"1.0.4.0"}}

{"type": "guessResponse", "contents": {"a": false, "C": "CEFGIOST", "g": false, "reqId": "C\u00e9sarDelSolar_g_6", "s": "C\u00e9sarDelSolar", "w": "ECOGIFTS"}}

```
once we guess, we immediately get a game over, which triggers the front end to send the endpacket. we then get the guessResponse too late. The endpacket should ideally be send after the guessResponse.


