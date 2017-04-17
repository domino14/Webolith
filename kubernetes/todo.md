- [x] Cronjob for daily maintenance
- [x] SSL cert replacement without downtime
    - build_configs.py has a function that will create a new k8s secret
    with the relevant TLS cert/key
    - We can apply this new secret with `kubectl apply -f secret.yaml`
    - Then we have to modify the `webolith-ingress.yaml` with a trivial change,
    like the `/hackpath`, and apply that change. This should replace the cert
    with no downtime (quickly tested with `ab`)
- [ ] Deploy process (circleCI?)
- [ ] kubeadm/juju/whatever for k8s cluster
- [ ] Create prod node, deploy! :D
After
- [ ] Container for webpack-related stuff
- [x] Fix docker-compose configs. (? or remove and use Minikube?)
    - Minikube kinda sucks because its clock is way off. Maybe it's an xhyve thing.
- [ ] Figure out automatic SSL renewing through LetsEncrypt