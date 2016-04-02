Flows after user clicks a social login button:

- User has no Aerolith account:
    + Default Pipeline should be used. A new user will be created for them. They should be presented with an option to change the username after creation.

- User has an Aerolith account but is not logged in:
    + If the account has the same email, it should automatically be associated (default pipeline)
    + If the account does not have the same email, we can't distinguish this from a non-existent account.
        * A new user will be created for them like above
        * They will say damn I already had another user
        * They can log out and log in as that other user using the regular username/password flow, then associate the account:

- User has an Aerolith account and is logged in:
    + Their social media account should be associated with the logged-in account. 
        * If the social media account is already associated with another account, associate it with this new account. The user should confirm. The old user account can be deactivated.
    + We should distinguish this. The "Login" text should be replaced with something like "Associate". Associated accounts should be tagged and unclickable.