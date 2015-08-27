Migrating the word/alphagram model to stand-alone SQLITE databases.

### High priority
- Code in:
    - wordwalls/game.py
    - wordwalls/models.py 
        In particular, missed bingos. we don't want to lose these, and 
        we may have to do a large migration.
    - genNamedLists.py
    - wordwalls/utils.py, see `get_pks_from_alphas_db`
    
### Lower priority
- whitleyCards/views.py
- wordwalls/api.py