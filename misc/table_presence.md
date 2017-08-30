When user logs in they request a list of tables. Table info comes back in, including users in table.

When a user joins a table, broadcast_presence gets called that sends front end all users in that table. This can be considered an idempotent update.

Possible issues:
- Broadcast presence arrives before the list of tables comes in
    - Race condition, how do we know which list of users is newer?
- A new table is created, and the user joining it arrives at front end before the new table notification comes in
    + How do we know which list of users is newer?
    
Solution:
Deal with it. This is rare enough, and presence *inside* the table should be ok? If it's not ok for a little bit, as soon as anyone leaves or joins the table, presence will be fixed by the idempotent update. Let's not stress and just do it this way.
