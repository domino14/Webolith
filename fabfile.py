from fabric.api import (env, run, roles, cd, settings, prefix, lcd, put, local,
                        execute, sudo)
import os
from scripts.digoceanssh import get_servers
from scripts.gen_firewall import gen_firewall

curdir = os.path.dirname(__file__)


env.key_filename = os.getenv("HOME") + "/.ssh/aerolith.pem"
env.roledefs = {
    'prod': ['ubuntu@192.241.203.184'],
    'prod_redis': ['ubuntu@192.241.203.24'],
    'prod_db': ['ubuntu@192.241.203.48']

}


@roles('prod')
def deploy_prod():
    with cd("Webolith"):
        run("git pull")
        with cd("djAerolith"):
            # Deploy JS build.
            deploy_js_build()
            with settings(warn_only=True):
                run("mkdir logs")
            with prefix("workon aeroenv"):
                # collect static files!
                # Copy settings_local_prod.py to settings_local.py
                put(os.path.join(curdir, 'djAerolith',
                                 'settings_local_prod.py'),
                    'settings_local.py')
                run("python manage.py collectstatic --noinput")
                # execute any needed migrations
                run("python manage.py migrate")
                run("kill -s QUIT `supervisorctl pid gunicorn`")


def deploy_js_build():
    """
        Uses r.js to generate a build.
    """
    lcd(os.path.join(curdir, 'djAerolith'))
    local("node r.js -o js_build/create_table_wordwalls.js")
    local("node r.js -o js_build/table_wordwalls.js")
    with settings(warn_only=True):
        local("rm static/build/*.gz")
    local("gzip -c static/build/table-main-built.js > "
          "static/build/table-main-built.js.gz")
    local("gzip -c static/build/create-table-main-built.js > "
          "static/build/create-table-main-built.js.gz")
    with settings(warn_only=True):
        with cd("static"):
            run("mkdir build")
    put(os.path.join(curdir, 'djAerolith', 'static/build/*.gz'),
        '/home/ubuntu/Webolith/djAerolith/static/build/')


@roles('prod')
def prod_fixtures():
    with cd("Webolith"):
        with cd("djAerolith"):
            with prefix("workon aeroenv"):
                run("python manage.py loaddata dcNames")


@roles('prod')
def restart_node():
    with cd("Webolith"):
        run("git pull")
        with cd("node"):
            with prefix("workon aeroenv"):
                # supervisorctl reload doesn't actually seem to restart
                # process :/
                run("supervisorctl restart mynode")


@roles('prod_sudo')
def reload_nginx_config():
    put(os.path.join(curdir, '/config/nginx.conf'),
        "/etc/nginx/nginx.conf", use_sudo=True)
    run("sudo kill -HUP $( cat /var/run/nginx.pid )")


def deploy_firewalls():
    servers = get_servers()
    execute(deploy_all_firewalls, servers)


@roles('prod', 'prod_db', 'prod_redis')
def deploy_all_firewalls(servers):
    secGroup = None
    if env.host_string in env.roledefs['prod']:
        secGroup = 'Web'
    elif env.host_string in env.roledefs['prod_db']:
        secGroup = 'Database'
    elif env.host_string in env.roledefs['prod_redis']:
        secGroup = 'Redis'
    gen_firewall(secGroup, servers)

    # write the firewall to the /etc/iptables.up.rules file
    put('iptables.%s.rules' % secGroup, '/etc/iptables.up.rules',
        use_sudo=True)
    sudo('iptables-restore < /etc/iptables.up.rules')
    os.remove('iptables.%s.rules' % secGroup)
    # Put this in /etc/network/interfaces:
    # pre-up iptables-restore < /etc/iptables.up.rules
    # So that the firewalls get restored on restart
