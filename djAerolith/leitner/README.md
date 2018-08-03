Implement the Leitner cardbox system, with flexibility towards wordwalls.

Store all user data in a properly indexed PGSQL database. If done correctly it should be fast enough and should allow us to easily look for analytics.

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