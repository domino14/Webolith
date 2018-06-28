Implement the Leitner cardbox system, with flexibility towards wordwalls.

Each user database should be stored in a separate SQLite instance. All
databases should be zipped and backed up daily.

Fields:

- alphagram
- length?
- lexicon
- last solved
- solve streak
- cardbox number
- next scheduled

When solving wordwalls, no matter for which wordwalls, always save info
transparently.