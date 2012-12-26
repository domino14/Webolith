from fabric.api import env, run,roles,cd, settings, prefix
import os

env.key_filename= os.getenv("HOME") + "/Dropbox/aws/cesarkey.pem"
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
                run("python manage.py collectstatic --noinput")  # collect static files!
                run("python manage.py migrate") # execute any needed migrations
            run("sudo supervisorctl reload")

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
