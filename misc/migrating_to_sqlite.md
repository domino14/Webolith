Migrating the word/alphagram model to stand-alone SQLITE databases.

### High priority
- Code in:
    - wordwalls/game.py
    - wordwalls/models.py 
        In particular, missed bingos. we don't want to lose these, and 
        we may have to do a large migration.

        Also, old daily challenges, etc etc. Lots of data to migrate.

        Should move to Postgres and use a JSON blob field?

        Not yet, do this prior.

    - genNamedLists.py
    - wordwalls/utils.py, see `get_pks_from_alphas_db`

- Data!
    + wordwalls_dailychallenge
    + wordwalls_dailychallengemissedbingos
    + wordwalls_namedlist
    + wordwalls_savedlist
    + wordwalls_wordwallsgamemodel
        * For this one it might be better to tie it to a savedlist.
        * We need to take into account games that are ongoing and 
        migrate them in-place to temporary word lists.
    
### Lower priority
- whitleyCards/views.py
- wordwalls/api.py


### Process
- Deploy 1 - Keep Word, Alphagram, but all new code must not use them,
    or if using them must do an "in-place" migration to new code.
    Then, run scripts to migrate all remaining lists/data to new way.
    DB Migrations 101 basically.
- Deploy 2 - Remove Word, Alphagram and run migration to remove them
    from the database.