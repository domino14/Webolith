"""
A script that will help us build the K8s config files for dev and prod
deployment.

"""
import yaml
import os
import base64
import re
import uuid
import sys


CURLIES_RE = r'{{\s(.+)\s}}'


def curlies_render(template, context):
    """ Render the mustache-style template with the variables in context. """
    def sub_func(matchobj):
        return context[matchobj.group(1)]

    return re.sub(CURLIES_RE, sub_func, template)


def build(role):
    """
    Build all the config files needed to get a deployment of webolith out.
    There are a number of them:
        - secrets-dev.yaml or secrets-prod.yaml
        - nginx-service/deployment yamls
        - webolith-service/deployment yamls

    For macondo service/deployment, deal with this in the future or in that
    repository. That will change so rarely that we can probably deal with
    it manually.

    For `secret-tls.yaml` we need another strategy. This one should be
    built by a daemon or crontab on the cluster itself off of letsencrypt.

    """

    build_webolith_secret(role)
    build_webolith_deployment(role)
    build_webolith_maintenance(role)
    build_nginx_static_deployment(role)
    build_webolith_ingress(role)


def get_env_var(role, var, secret=False):
    key = (role + '_' + var).upper()
    env_var = os.getenv(key, '')
    if not env_var:
        sys.exit('Environment variable ' + key + ' must be provided.')
    if secret:
        return base64.b64encode(env_var)
    return env_var


def build_webolith_secret(role):
    with open('kubernetes/deploy-configs/webolith-secrets.yaml') as f:
        secret_template = yaml.load(f)
    for var_name in ['PGSQL_PASSWORD', 'PGSQL_HOST', 'DJANGO_SECRET_KEY',
                     'MAILGUN_PW', 'RECAPTCHA_PRIVATE_KEY',
                     'AWS_SECRET_ACCESS_KEY', 'SOCIAL_AUTH_FACEBOOK_SECRET',
                     'SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET']:
        secret_template['data'][var_name] = get_env_var(role, var_name, True)
    with open('kubernetes/deploy-configs/{role}-webolith-secrets.yaml'.format(
            role=role), 'wb') as f:
        f.write(yaml.dump(secret_template, default_flow_style=False))


def build_webolith_deployment(role):
    """ This one will be built as a mustache-style template. """
    with open('kubernetes/deploy-configs/webolith-deployment.yaml') as f:
        template = f.read()

    context = {}
    for var_name in ['PGSQL_DB_NAME', 'PGSQL_USER', 'MACONDO_ADDRESS',
                     'AWS_ACCESS_KEY_ID',
                     'SOCIAL_AUTH_FACEBOOK_KEY',
                     'SOCIAL_AUTH_GOOGLE_OAUTH2_KEY']:
        context[var_name] = get_env_var(role, var_name)
    context['BUILD_NUM'] = os.getenv('CIRCLE_BUILD_NUM', '')
    context['WORD_DB_DIR'] = os.getenv('WORD_DB_DIR', '')
    rendered = curlies_render(template, context)
    with open(
        'kubernetes/deploy-configs/{role}-webolith-deployment.yaml'.format(
            role=role), 'wb') as f:
        f.write(rendered)


def build_webolith_maintenance(role):
    with open('kubernetes/deploy-configs/webolith-maintenance.yaml') as f:
        template = f.read()

    context = {}
    for var_name in ['PGSQL_DB_NAME', 'PGSQL_USER', 'AWS_ACCESS_KEY_ID',
                     'BACKUP_BUCKET_SUFFIX']:
        context[var_name] = get_env_var(role, var_name)
    context['BUILD_NUM'] = os.getenv('CIRCLE_BUILD_NUM', '')
    rendered = curlies_render(template, context)
    with open(
        'kubernetes/deploy-configs/{role}-webolith-maintenance.yaml'.format(
            role=role), 'wb') as f:
        f.write(rendered)


def build_webolith_ingress(role):
    with open('kubernetes/deploy-configs/webolith-ingress.yaml') as f:
        template = f.read()
    context = {}

    context['HOST_NAME'] = get_env_var(role, 'HOST_NAME')
    context['HACK_PATH'] = '/hackpath-{0}'.format(uuid.uuid4().hex)
    rendered = curlies_render(template, context)
    with open('kubernetes/deploy-configs/{role}-webolith-ingress.yaml'.format(
            role=role), 'wb') as f:
        f.write(rendered)


def build_nginx_static_deployment(role):
    """ Build a static deployment with a simple replace in YAML. """
    with open('kubernetes/deploy-configs/nginx-static-deployment.yaml') as f:
        deployment = yaml.load(f)
    image = 'domino14/webolith-nginx:{buildnum}'.format(
        buildnum=os.getenv('CIRCLE_BUILD_NUM'))
    deployment['spec']['template']['spec']['containers'][0]['image'] = image
    with open(
        'kubernetes/deploy-configs/{role}-nginx-static-deployment.yaml'.format(
            role=role), 'wb') as f:
        f.write(yaml.dump(deployment, default_flow_style=False))


def build_macondo_deployment(role):
    """ This will be called very rarely, so we'll make a function for it
        here but not actually use it till later. """
    with open('kubernetes/deploy-configs/macondo-deployment.yaml') as f:
        template = f.read()
    context = {
        'MACONDO_BUILD_NUM': os.getenv('MACONDO_BUILD_NUM'),
        'DAWG_PATH': os.getenv('DAWG_PATH'),
    }
    rendered = curlies_render(template, context)
    with open(
        'kubernetes/deploy-configs/{role}-macondo-deployment.yaml'.format(
            role=role), 'wb') as f:
        f.write(rendered)


def create_ssl_secret(key_file, crt_file, role):
    with open(key_file) as f:
        contents = f.read()
    enc_key = base64.b64encode(contents)
    with open(crt_file) as f:
        contents = f.read()
    enc_crt = base64.b64encode(contents)
    with open('kubernetes/deploy-configs/secret-tls.yaml') as f:
        template = yaml.load(f)
    template['data']['tls.crt'] = enc_crt
    template['data']['tls.key'] = enc_key
    with open('kubernetes/deploy-configs/{role}-secret-tls.yaml'.format(
            role=role), 'wb') as f:
        f.write(yaml.dump(template, default_flow_style=False))


if __name__ == '__main__':
    # create_ssl_secret(sys.argv[1], sys.argv[2], 'dev')
    build_webolith_ingress('dev')
