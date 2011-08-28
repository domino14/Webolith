from fabric.api import env, run,roles
import os

env.key_filename= os.getenv("HOME") + "/Dropbox/aws/cesarkey.pem"
env.roledefs = {
    'prod_web': ['ec2-user@aerolith.org']
}

@roles('prod')
def deploy_prod():
    run("kill `cat /home/ec2-user/webolith/gunicorn.pid`")  # kill the gunicorn process
    run("cd webolith/ && git pull")
    run("cd djAerolith && python manage.py collectstatic")  # collect static files!
    # TODO take care of migrations
    run("python manage.py run_gunicorn --config ../gunicornConf.py --daemon")
    