Webolith uses this library (wdb_interface) to interface with `word_db_server`.

The uncreatively-named `word_db_server` is a Go-written ConnectRPC server that takes
care of all word-related functionality. That allows this app (webolith) to
just be a web app, and offload word-related stuff to a fast server.

See `https://github.com/domino14/word_db_server` for more info.