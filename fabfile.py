import os
import base64

from fabric.api import (env, run, roles, cd, settings, prefix, lcd, put, local,
                        execute, sudo)

from scripts.digoceanssh import get_servers
from scripts.gen_firewall import gen_firewall

curdir = os.path.dirname(__file__)
print curdir

# Don't specify a filename for the key - circle will do the right thing?
# env.key_filename = os.getenv("HOME") + "/.ssh/aerolith.pem"
env.roledefs = {
    'prod': ['ubuntu@www.aerolith.org'],
    'dev': ['ubuntu@dev.aerolith.org'],
    'prod_db': ['ubuntu@159.203.220.140']
}


def deploy(role, skipjs=False):
    execute(_deploy, role, skipjs, role=role)


def create_base64_env_file(role):
    if role == 'prod':
        config_file = 'config/prod_config.env'
    elif role == 'dev':
        config_file = 'config/dev_config.env'

    f = open(config_file)
    contents = f.read()
    f.close()

    print base64.b64encode(contents)


def _deploy(role, skipjs):
    if role == 'prod':
        config_envvar = 'PROD_CONFIG_FILE_B64'
    elif role == 'dev':
        config_envvar = 'DEV_CONFIG_FILE_B64'
    with cd("webolith"):
        run("git pull")
        # Deploy JS build.
        if skipjs is False:
            deploy_js_build()
        f = open('config/config.env', 'wb')
        f.write(base64.b64decode(os.getenv(config_envvar)))
        f.close()
        run("docker exec -it webolith_app_1 ../scripts/deploy.sh")


def deploy_word_db(lexicon_name, role):
    execute(_deploy_word_db, lexicon_name, role, role=role)


def _deploy_word_db(lexicon_name, role):
    # This will hopefully be done super rarely.
    with settings(warn_only=True):
        run('mkdir word_db')
    with cd('word_db'):
        put(os.path.join(curdir, 'db', '%s.db' % lexicon_name),
            '%s.db' % lexicon_name)


def deploy_js_build():
    """ Assumes build has already been created with yarn. """
    with settings(warn_only=True):
        with cd("djAerolith/static"):
            run("mkdir dist")
    put(os.path.join(curdir, 'djAerolith', 'static/dist/*.gz'),
        '/home/ubuntu/webolith/djAerolith/static/dist/')


@roles('prod')
def prod_fixtures():
    with cd("webolith"):
        with cd("djAerolith"):
            with prefix("workon aeroenv"):
                run("python manage.py loaddata dcNames")


@roles('prod')
def restart_node():
    with cd("webolith"):
        run("git pull")
        with cd("node"):
            with prefix("workon aeroenv"):
                # supervisorctl reload doesn't actually seem to restart
                # process :/
                run("supervisorctl restart mynode")


@roles('prod')
def reload_nginx_config():
    put(os.path.join(curdir, 'config/nginx.conf'),
        "/etc/nginx/nginx.conf", use_sudo=True)
    run("sudo kill -HUP $( cat /var/run/nginx.pid )")


def deploy_firewalls():
    servers = get_servers()
    execute(deploy_all_firewalls, servers)


@roles('prod_db')
def deploy_all_firewalls(servers):
    # DON'T DEPLOY THIS TO THE WEB ROLE!!!
    # DOCKER MAKES ITS OWN CHAINS AND SCREWS EVERYTHING UP!!
    secGroup = None
    if env.host_string in env.roledefs['prod']:
        secGroup = 'Web'
    elif env.host_string in env.roledefs['prod_db']:
        secGroup = 'Database'
    elif env.host_string in env.roledefs['dev']:
        secGroup = 'Dev'
    gen_firewall(secGroup, servers)

    # write the firewall to the /etc/iptables.up.rules file
    put('iptables.%s.rules' % secGroup, '/etc/iptables.up.rules',
        use_sudo=True)
    sudo('iptables-restore < /etc/iptables.up.rules')
    os.remove('iptables.%s.rules' % secGroup)
    # Put this in /etc/network/interfaces:
    # pre-up iptables-restore < /etc/iptables.up.rules
    # So that the firewalls get restored on restart


def init_database():
    """
    Create database from scratch. Requires a djaerolith database to
    have been created.

    """
    local('python manage.py migrate')
    local('python manage.py loaddata wordwalls/fixtures/test/lexica.json')
    local('python manage.py loaddata dcNames')
