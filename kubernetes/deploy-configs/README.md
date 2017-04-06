This directory contains the configs to deploy to dev/prod. These should
all be yaml files that can be applied with something like:

`kubectl apply -f file.yaml`

Some of the files contain placeholders to be filled in while deploying.

Encrypting with openssl:

`openssl des3 -pass stdin -in <infile> -out <outfile>`

Then press enter, then enter your password, then enter again.