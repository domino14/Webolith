# Created database
root@cc06da451366:/# psql -U postgres
psql (9.5.1)
Type "help" for help.

postgres=# create database djaerolith;

# To save data

TODO for testing:
- Get a MySQL dump.
- Load locally
- Run `dump_data_chunks`
- Create brand new PG database
- Run data load script. There should be no errors. If there are, fix and repeat.

Exclude unneeded apps, and apps that will automatically get data added to them during the initial `./manage.py migrate` when setting up the pg database.

```
./manage.py dump_data_chunks --exclude contenttypes  --exclude auth.Permission --traceback --output-folder /opt/dump_folder --max-records-per-chunk=1000 --natural

```
----------

To do now:

- Delete all migration files 
- Clear migrations table of all app migrations (keep django-related migrations)
- Make migrations on Postgres db and save migration files

After creating all dump files:

- Load into Postgres
- [x] Figure out how to rename "wordwalls_savedlist" to "base_wordlist"

`alter table wordwalls_savedlist rename to base_wordlist`

- [x] Remove proxy models in `base.models`

## Issues:
- Postgres is case sensitive. 
    - [x] Can't log in unless capitalization of screen name is identical. Probably want to enforce uniqueness regardless of capitalization. >.<
    