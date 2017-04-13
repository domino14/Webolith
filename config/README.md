If we can't figure out the kubernetes ingress issues, we should just go
back to figuring out an HAProxy-based solution. That was a nice foray
into it and I learned a bunch, but another issue is that Kubernetes seems
particularly intensive on memory/CPU. It may not be a big deal for a big AWS
instance, but I can't even use the $5 DO instance, and the $10 one seems 
overloaded. 

Another positive is that now we have good containerized versions of everything.
But will need to figure out Webolith <--> Macondo network, and the HAProxy network to everything.

### Rough design

Master nginx (not a container) ---> HAProxy (container?) ---> static-server 
      (SSL Termination)                 |
                                        |------> containerized webolith
                                        |
                                        |------> containerized macondo

Should talk to HAProxy API on the fly.

haproxy.cfg should contain just one version of the three things above.

When we deploy, we need to do something akin to the following:
- Spin up a new version of the thing
- Wait until it's ready
- Add it to the haproxy
- Drain the old version of the thing
- Wait until that's drained
- Done

### Implementation notes

```bash

$ docker network create --driver bridge --subnet=192.168.17.0/24 aeronet
$ docker run --rm --env-file=config/vm_config.env --network=aeronet --name=webolith domino14/webolith:latest
$ docker run --rm --network=aeronet --name=nginx-static domino14/webolith-nginx:237
# in config dir
$ docker run --rm --network=aeronet --name=haproxy -v `pwd`/private-ssl:/etc/ssl/private/ -p 80:80 -p 443:443 -p 9999:9999 my-haproxy

```

LOL. haproxy doesn't support dynamic adding/removing of servers. is there literally nothing out there that can give me a goddamn zero-downtime deploy???????

New flow:

- Have two versions of the servers on haproxy. For gunicorn will probably want to just run two listeners each. Or we can run one with three and set the other one to maintenance on startup?
- When deploying:
    + Take one down for maintenance with haproxy API (`set server state drain`)
    + `docker stop` the old container
    + `docker run` new container
    + Figure out new container's IP with docker API (or maybe can use hostname)
    + Change IP for server in haproxy API (`set server addr <ip>`)
    + `set server state ready`
    + Repeat these steps for other container
    + Write new config to haproxy.cfg?