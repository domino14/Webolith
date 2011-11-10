from fabric.api import env, run,roles,cd, settings, prefix
import os

env.key_filename= os.getenv("HOME") + "/Dropbox/aws/cesarkey.pem"
env.roledefs = {
    'prod': ['ubuntu@aerolith.org']
}

@roles('prod')
def deploy_prod():    
    with settings(warn_only=True):
        run("kill `cat /home/ubuntu/webolith/gunicorn.pid`")  # kill the gunicorn process    
    with cd("webolith"):
        run("git pull")
        with cd("djAerolith"):
            with settings(warn_only=True):
                run("mkdir logs")
            with prefix("workon aeroenv"):
                run("python manage.py collectstatic --noinput")  # collect static files!
                run("python manage.py migrate") # execute any needed migrations
                run("python manage.py run_gunicorn --config ../gunicornConf.py --daemon")
                run("sleep 3")

@roles('prod')
def test_prod():
    with cd("webolith/"):
        with cd("djAerolith/"):
            run("ls -al")

@roles('prod')
def prod_fixtures():
    with cd("webolith"):
        with cd("djAerolith"):
            with prefix("workon aeroenv"):
                run("python manage.py loaddata dcNames") 
