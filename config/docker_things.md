`cesar@mbp:~/coding/webolith (ops/xxx/docker)$ docker run --rm -it domino14/webolith-django /bin/bash`

Then, in bash:
`# mysql -h 172.17.0.2 -p`   (ip came from inspect on running mysql db)


mysql db was started like:

`docker run --rm -it --volumes-from webolith_db_data_1 mysql:latest`

`webolith_db_data_1` came from  `docker-compose up db_data`


----

Some obsolete notes, may delete soon (we probably don't need HAProxy)
# How to use this HAProxy config:
# - Create a Docker container for HAProxy

# Plan.
# 1. We _need_ HAProxy, because DigitalOcean and ECS Load Balancers both cost
# way too much (at least $20 a month, which is not that much in the grand
# scheme of things, but it's a ripoff for a two-node site when each node
# is ~5 bucks).
# 2. If we containerize the nginx, the deploy solution can be clean (assuming
# Kubernetes)
#   - Deploying webolith will:
#       - On CircleCI build front end assets with yarn
#           - Run the collectstatic script
#           - Create a new nginx container with the static contents created
#           by collectstatic. It also does SSL termination.
#               - SSL should be a secret. (Or see how Ingress does it)
#               - It can be mounted in some way through the API from CircleCI
#               during the deploy or something.
#               - This is probably going to be difficult.
#           - Optional build of this container? What if we haven't changed
#           static assets at all? We can maybe let circleCI know somehow.
#       - Create a new webolith container with the new Python code.
#
#
#   - Deploying macondo will:
#        - Create a new macondo container with the new Python code.
#
#  3. We need HAProxy to ensure HA to the Nginx containers from the outside
#  (an ingress?) We should probably explore the Ingress resource.
#        - HA from the Django service to Nginx is already handled by the
#        service.
#        - See how HAProxy routes to the outside world?
#        - Its backend servers need to include the routable address
#        of the nginx process. Either we need both processes, or see
#        if we can do with just one. By HA I mean during the deploy process
#        we always want the Nginx process to be serving
#        - Otherwise, is there a way that K8s can bind to 0.0.0.0:<port>? If
#        so, maybe we don't need HAProxy after all.
#
#   4. If we don't dockerize Nginx, which is simpler for right now, then
#   the entry in the nginx cfg file needs to be
#   127.0.0.1:<port of django service>. How do we ensure that we bind on
#   0.0.0.0?
#