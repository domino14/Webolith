# Created database
root@cc06da451366:/# psql -U postgres
psql (9.5.1)
Type "help" for help.

postgres=# create database djaerolith;

# To save data
`./manage.py dumpdata_chunks --exclude registration --exclude migrations --traceback --output-folder /opt/dump_folder --max-records-per-chunk=1000`

# Load into postgres
`find /opt/dump_folder | egrep -o "([0-9]+_[0-9]+).json" |sort | awk '{print "./manage.py loaddata --database postgres /opt/dump_folder/"$1}' > script-to-loaddata.sh`

time sh script-to-loaddata.sh
about 40 minutes on my machine
~ 10? minutes to save data
----------

To do now:
=- Make migrations on Postgres db and save migration files

After creating all dump files:

- Load into Postgres
- [x] Figure out how to rename "wordwalls_savedlist" to "base_wordlist"

`alter table wordwalls_savedlist rename to base_wordlist`

- [x] Remove proxy models in `base.models`

## Issues:
- Postgres is case sensitive. 
    - [ ] Can't log in unless capitalization of screen name is identical. Probably want to enforce uniqueness regardless of capitalization. >.<
    