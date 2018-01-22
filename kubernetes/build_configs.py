"""
A script that will help us build the K8s config files for dev and prod
deployment.

"""
import os
import base64
import re
import uuid
import sys

import yaml


CURLIES_RE = r'{{\s*(\w+)\s*}}'


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
    build_channels_cleanup(role)


def get_env_var(role, var, secret=False):
    key = (role + '_' + var).upper()
    env_var = os.getenv(key)
    if env_var is None:
        sys.exit('Environment variable ' + key + ' must be provided.')
    if secret:
        return base64.b64encode(bytes(env_var, 'utf-8'))
    return env_var


def build_webolith_secret(role):
    with open('kubernetes/deploy-configs/webolith-secrets.yaml') as f:
        secret_template = yaml.load(f)
    for var_name in ['PGSQL_PASSWORD', 'PGSQL_HOST', 'DJANGO_SECRET_KEY',
                     'MAILGUN_PW', 'RECAPTCHA_PRIVATE_KEY',
                     'SOCIAL_AUTH_FACEBOOK_SECRET',
                     'INTERCOM_APP_SECRET_KEY',
                     'SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET']:
        secret_template['data'][var_name] = get_env_var(role, var_name, True)
    with open('kubernetes/deploy-configs/{role}-webolith-secrets.yaml'.format(
            role=role), 'w') as f:
        f.write(yaml.dump(secret_template, default_flow_style=False))


def build_webolith_deployment(role):
    """ This one will be built as a mustache-style template. """
    name = 'webolith-worker-deployment.yaml'
    with open('kubernetes/deploy-configs/{}'.format(name)) as f:
        template = f.read()

    context = {}
    for var_name in ['PGSQL_DB_NAME', 'PGSQL_USER', 'MACONDO_ADDRESS',
                     'SOCIAL_AUTH_FACEBOOK_KEY', 'INTERCOM_APP_ID',
                     'SOCIAL_AUTH_GOOGLE_OAUTH2_KEY']:
        context[var_name] = get_env_var(role, var_name)
    context['BUILD_NUM'] = os.getenv('CIRCLE_BUILD_NUM', '')
    context['WORD_DB_DIR'] = os.getenv('WORD_DB_DIR', '')
    rendered = curlies_render(template, context)
    with open(
        'kubernetes/deploy-configs/{role}-{name}'.format(
            role=role, name=name), 'w') as f:
        f.write(rendered)


def build_webolith_maintenance(role):
    with open('kubernetes/deploy-configs/webolith-maintenance.yaml') as f:
        template = f.read()

    context = {}
    for var_name in ['PGSQL_DB_NAME', 'PGSQL_USER']:
        context[var_name] = get_env_var(role, var_name)
    context['BUILD_NUM'] = os.getenv('CIRCLE_BUILD_NUM', '')
    rendered = curlies_render(template, context)
    with open(
        'kubernetes/deploy-configs/{role}-webolith-maintenance.yaml'.format(
            role=role), 'w') as f:
        f.write(rendered)


def build_channels_cleanup(role):
    name = 'webolith-channels-cleanup.yaml'
    with open('kubernetes/deploy-configs/{}'.format(name)) as f:
        template = f.read()

    context = {}
    for var_name in ['PGSQL_DB_NAME', 'PGSQL_USER']:
        context[var_name] = get_env_var(role, var_name)
    context['BUILD_NUM'] = os.getenv('CIRCLE_BUILD_NUM', '')
    rendered = curlies_render(template, context)
    with open(
        'kubernetes/deploy-configs/{role}-{name}'.format(
            role=role, name=name), 'w') as f:
        f.write(rendered)


def build_webolith_ingress(role):
    with open('kubernetes/deploy-configs/webolith-ingress.yaml') as f:
        template = f.read()
    context = {}

    context['HOST_NAME'] = get_env_var(role, 'HOST_NAME')
    context['HACK_PATH'] = '/hackpath-{0}'.format(uuid.uuid4().hex)
    rendered = curlies_render(template, context)
    with open('kubernetes/deploy-configs/{role}-webolith-ingress.yaml'.format(
            role=role), 'w') as f:
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
            role=role), 'w') as f:
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
            role=role), 'w') as f:
        f.write(rendered)


if __name__ == '__main__':
    # create_ssl_secret(sys.argv[1], sys.argv[2], 'dev')
    build_webolith_ingress('dev')
