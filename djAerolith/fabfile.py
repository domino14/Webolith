from fabric.api import env, run,roles,cd, settings, prefix
import os

env.key_filename= os.getenv("HOME") + "/Dropbox/aws/cesarkey.pem"
env.roledefs = {
    'prod': ['ubuntu@ec2-50-18-16-103.us-west-1.compute.amazonaws.com']
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

@roles('prod')
def test_prod():
    with cd("webolith/"):
        with cd("djAerolith/"):
            run("ls -al")
