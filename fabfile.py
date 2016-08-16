import os

from fabric.api import env, local, execute

from kubernetes.build_configs import build

curdir = os.path.dirname(__file__)
print curdir

# Don't specify a filename for the key - circle will do the right thing?
# env.key_filename = os.getenv("HOME") + "/.ssh/aerolith.pem"
env.roledefs = {
    'prod': ['ubuntu@www.aerolith.org'],
    'dev': ['ubuntu@dev.aerolith.org'],
    'prod_db': ['ubuntu@159.203.220.140']
}


def create_k8s_configs(role):
    execute(_create_k8s_configs, role, role=role)


def _create_k8s_configs(role):
    build(role)


def deploy(role):
    execute(_deploy, role, role=role)


def _deploy(role):
    """
    The main deployment function. k8s configs must already be created.

    """
    # To deploy,
    # kubectl --kubeconfig admin.conf apply -f whatever.yaml
    # etc.
    # Maybe this can be done just locally?
    pass

# @roles('prod')
# def prod_fixtures():
#     with cd("webolith"):
#         with cd("djAerolith"):
#             with prefix("workon aeroenv"):
#                 run("python manage.py loaddata dcNames")


# def deploy_firewalls():
#     servers = get_servers()
#     execute(deploy_all_firewalls, servers)


# @roles('prod_db')
# def deploy_all_firewalls(servers):
#     # DON'T DEPLOY THIS TO THE WEB ROLE!!!
#     # DOCKER MAKES ITS OWN CHAINS AND SCREWS EVERYTHING UP!!
#     secGroup = None
#     if env.host_string in env.roledefs['prod']:
#         secGroup = 'Web'
#     elif env.host_string in env.roledefs['prod_db']:
#         secGroup = 'Database'
#     elif env.host_string in env.roledefs['dev']:
#         secGroup = 'Dev'
#     gen_firewall(secGroup, servers)

#     # write the firewall to the /etc/iptables.up.rules file
#     put('iptables.%s.rules' % secGroup, '/etc/iptables.up.rules',
#         use_sudo=True)
#     sudo('iptables-restore < /etc/iptables.up.rules')
#     os.remove('iptables.%s.rules' % secGroup)
#     # Put this in /etc/network/interfaces:
#     # pre-up iptables-restore < /etc/iptables.up.rules
#     # So that the firewalls get restored on restart


def init_database():
    """
    Create database from scratch. Requires a djaerolith database to
    have been created.

    """
    local('python manage.py createcachetable')
    local('python manage.py migrate')
    local('python manage.py loaddata wordwalls/fixtures/test/lexica.json')
    local('python manage.py loaddata dcNames')
