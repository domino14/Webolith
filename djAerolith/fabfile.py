from fabric.api import env, run, roles, cd, settings, prefix, lcd, put, local
import os

curdir = os.path.dirname(__file__)


env.key_filename = os.getenv("HOME") + "/.rackspace/aerolith_production.pem"
env.roledefs = {
    'prod': ['ubuntu@aerolith.org'],
    'prod_sudo': ['cesar@aerolith.org']
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
                put(os.path.join(curdir, 'settings_local_prod.py'),
                    'settings_local.py')
                run("python manage.py collectstatic --noinput")
                # execute any needed migrations
                run("python manage.py migrate")
                run("kill -s QUIT `supervisorctl pid gunicorn`")


def deploy_js_build():
    """
        Uses r.js to generate a build.
    """
    lcd(curdir)
    local("node r.js -o js_build/create_table_wordwalls.js")
    local("node r.js -o js_build/table_wordwalls.js")
    with settings(warn_only=True):
        local("rm static/build/*.gz")
    local("gzip -c static/build/table-main-built.js > "
          "static/build/table-main-built.js.gz")
    local("gzip -c static/build/create-table-main-built.js > "
          "static/build/create-table-main-built.js.gz")
    with settings(warn_only=True):
        with cd("Webolith/djAerolith/static"):
            run("mkdir build")
    put(os.path.join(curdir, 'static/build/*.gz'),
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
                run("supervisorctl restart my_node")


@roles('prod_sudo')
def reload_nginx_config():
    put(os.path.join(curdir, '../config/nginx.conf'),
        "/etc/nginx/nginx.conf", use_sudo=True)
    run("sudo kill -HUP $( cat /var/run/nginx.pid )")
