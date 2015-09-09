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
    
### Lower priority
- whitleyCards/views.py
- wordwalls/api.py


