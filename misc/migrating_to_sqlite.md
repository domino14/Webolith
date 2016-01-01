Migrating the word/alphagram model to stand-alone SQLITE databases.

### High priority
- Code in:
    x wordwalls/game.py
    x wordwalls/models.py 
        In particular, missed bingos. we don't want to lose these, and 
        we may have to do a large migration.

        Also, old daily challenges, etc etc. Lots of data to migrate.

    x genNamedLists.py
    x wordwalls/utils.py, see `get_pks_from_alphas_db`
    - flashcards/views.py
    - base/utils.py
    x base/views.py
    x Write script to auto-delete old lists when tables are cleaned up.

- Data!
    + wordwalls_dailychallenge
    + wordwalls_dailychallengemissedbingos
    + wordwalls_namedlist
    + wordwalls_savedlist
    + wordwalls_wordwallsgamemodel
        * tie it to a saved list.
    
### Lower priority
- whitleyCards/views.py
- wordwalls/api.py

### Process

No in-place migrations. This will take a very long time to write all the
cases. Instead, take the app down, migrate everything, and bring
it back up. It should be only a couple hours of downtime at most, can
do it on a Sunday afternoon/evening with warning.

- Write migration scripts and test thoroughly. Run on a database dump.
- Repeat until satisfied.
- Test all paths in the app manually. 
    + Including saved lists. Save a list, delete it, try to save again,
    etc.
- Announce downtime a few days in advance at least.
- Take app down. 
- Make a database backup!
- Deploy 1 - Keep Word, Alphagram, but all new code must not use them.
- Run all migration scripts:
    - Migrate Daily Challenge; all daily challenges must be migrated to
    use alphagrams.
    - All Daily Challenge Missed Bingos must be migrated to use 
    alphagram_string
    - All games in progress must be migrated to use a word_list for the
    WordwallsGameMode.
    - All Named Lists must be migrated to use alphagrams and answers.
    - All Saved Lists must be migrated to version 2.

    Scripts:
    ```
    migrate_daily_challenges.py   ~ 15 minutes
    migrate_wordwalls_games.py - Run this BEFORE migrating saved lists.
        The saved lists migrations will further migrate these new lists
        to version 2.
    migrate_saved_lists.py

    ```

- Deploy 2 - Remove Word, Alphagram and run migration to remove them
    from the database.
- Bring app back up.