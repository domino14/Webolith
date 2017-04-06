Contains the Kubernetes config files to get a whole deployment of 
Aerolith out (and also on Minikube for local development)

Consider moving this to a separate repository.
-----
Needed for staging/prod:

- webolith django
- postgres (not yet, we can just use the existing server IP, manage this separately)
- macondo
- nginx

-----

## Using Minikube locally (maybe deprecated - we can just use docker-compose locally)

Starting up locally:
Install Docker for Mac/Windows/whatever, install minikube.

`$ minikube start`
`$ eval $(minikube docker-env)   # use the machine's Docker`
`$ kubectl create -f postgres-volumes.yaml`
`$ kubectl create -f postgres-service.yaml`
`$ kubectl create -f secrets-vm.yaml`
`$ kubectl create -f webolith-service.yaml`

`$ minikube ip` gives you the ip and `kubectl get svc django-service` prints out the relevant port

```
NAME                      CLUSTER-IP   EXTERNAL-IP   PORT(S)          AGE
webolith-django-service   10.0.0.237   <nodes>       8000:32541/TCP   11h
```
(32541 in this example)

## Staging/production

`./deploy-configs` contains the configs used for the production/staging servers.

### nginx-static

Nginx-static is based on a publicly available Nginx docker package. We use it to serve the Webolith static assets after building with circle-ci. We include the assets directly in the image for simplicity, and create a new Docker image on Dockerhub: `webolith-nginx:$CIRCLE_BUILD_NUM`.

The relevant Kubernetes config files are `nginx-static-deployment.yaml` and `nginx-static-service.yaml`.

### webolith

Webolith is based on our own `domino14/webolith-base-pkg`. The Dockerfile for the latter is in `base_pkg.dockerfile` in the root directory of this repo.

The base package is based on `python:2-alpine` and includes all the prod requirements. Then, to build the webolith package, we just need to copy the Python code over. This will shorten build times, but when we add new dependencies we need to remember to rebuild the base pkg. Hopefully if we forget, there is a test in the circleci file that brings up the new docker image and tries to ping it.

The relevant Kubernetes configs are `webolith-deployment.yaml`, `webolith-service.yaml`, and `webolith-secrets.yaml`.

### macondo

The macondo service and deployment will very rarely be updated and we can probably do a lot of this manually with the `macondo-deployment` and service files. 

### ingress

We are using the publicly available nginxinc ingress controller. We do SSL termination in `webolith-ingress.yaml`, see `secret-tls.yaml`. The controller configs are in `nginx-ingress-rc.yaml`. 

The ingress directs traffic to `webolith` and `nginx-static` services based on the path.

No solution yet for automatic updating of the TLS secrets. I may need to script LetsEncrypt.

## Deployment

We can probably deploy locally using kubectl after the circle containers are done building.

DB migrations should be done manually in the DB. Hopefully these will be rare. Or we can maybe add them to the preStart hook?

## Maintenance

We have a daily maintenance script in `dailyCleanup.sh`. We need to figure out how to containerize this. It's possible we can also do this in a kubectl exec command. If so we should override the command that makes gunicorn run.