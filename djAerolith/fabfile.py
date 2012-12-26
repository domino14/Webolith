from fabric.api import env, run, roles, cd, settings, prefix
import os

env.key_filename = os.getenv("HOME") + "/.rackspace/aerolith_production.pem"
env.roledefs = {
    'prod': ['ubuntu@aerolith.org']
}


@roles('prod')
def deploy_prod():
    with cd("Webolith"):
        run("git pull")
        with cd("djAerolith"):
            with settings(warn_only=True):
                run("mkdir logs")
            with prefix("workon aeroenv"):
                # collect static files!
                run("python manage.py collectstatic --noinput")
                # execute any needed migrations
                run("python manage.py migrate")
                run("supervisorctl reload")


@roles('prod')
def test_prod():
    with cd("Webolith/"):
        with cd("djAerolith/"):
            run("ls -al")


@roles('prod')
def prod_fixtures():
    with cd("Webolith"):
        with cd("djAerolith"):
            with prefix("workon aeroenv"):
                run("python manage.py loaddata dcNames")
