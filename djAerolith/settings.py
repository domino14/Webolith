# Aerolith 2.0: A web-based word game website
# Copyright (C) 2011 Cesar Del Solar
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

# To contact the author, please email delsolar at gmail dot com

# Django settings for djAerolith project.
import os
import re
import settings_local   # this file is not shared on vcs
DEBUG = settings_local.DEBUG
TEMPLATE_DEBUG = DEBUG
DEBUG_JS = settings_local.DEBUG_JS

ADMINS = (
     ('Cesar Del Solar', 'delsolar@gmail.com'),
)

MANAGERS = ADMINS

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql', # Add 'postgresql_psycopg2', 'postgresql', 'mysql', 'sqlite3' or 'oracle'.
        'NAME': 'djAerolith',                      # Or path to database file if using sqlite3.
        'USER': settings_local.sqlUser,                      # Not used with sqlite3.
        'PASSWORD': settings_local.sqlPw,                  # Not used with sqlite3.
        'HOST': settings_local.SQL_HOST,                      # Set to empty string for localhost. Not used with sqlite3.
        'PORT': '',                      # Set to empty string for default. Not used with sqlite3.
        'OPTIONS': {"init_command": "SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED" } ,
        # I HATE YOU MYSQL I HATE YOU I SHOULDN'T NEED THIS OPTION.
    }
}

# Local time zone for this installation. Choices can be found here:
# http://en.wikipedia.org/wiki/List_of_tz_zones_by_name
# although not all choices may be available on all operating systems.
# On Unix systems, a value of None will cause Django to use the same
# timezone as the operating system.
# If running in a Windows environment this must be set to the same as your
# system time zone.
TIME_ZONE = 'America/Los_Angeles'

# Language code for this installation. All choices can be found here:
# http://www.i18nguy.com/unicode/language-identifiers.html
LANGUAGE_CODE = 'en-us'

SITE_ID = 1

# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = True

# If you set this to False, Django will not format dates, numbers and
# calendars according to the current locale
USE_L10N = True

# Absolute filesystem path to the directory that will hold user-uploaded files.
# Example: "/home/media/media.lawrence.com/"
MEDIA_ROOT = ''

# URL that handles the media served from MEDIA_ROOT. Make sure to use a
# trailing slash if there is a path component (optional in other cases).
# Examples: "http://media.lawrence.com", "http://example.com/media/"
MEDIA_URL = ''

STATIC_ROOT = settings_local.STATIC_ROOT
STATIC_URL = '/static/'
# URL prefix for admin media -- CSS, JavaScript and images. Make sure to use a
# trailing slash.
# Examples: "http://foo.com/media/", "/media/".

ADMIN_MEDIA_PREFIX = '/static/admin/'

# Make this unique, and don't share it with anybody.
SECRET_KEY = settings_local.SECRET_KEY

# List of callables that know how to import templates from various sources.
TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.Loader',
    'django.template.loaders.app_directories.Loader',
#     'django.template.loaders.eggs.Loader',
)

STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
)


MIDDLEWARE_CLASSES = (
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.transaction.TransactionMiddleware',
    #'debug_toolbar.middleware.DebugToolbarMiddleware',
)

ROOT_URLCONF = 'djAerolith.urls'

PROJECT_ROOT = os.path.realpath(os.path.dirname(__file__))

TEMPLATE_DIRS = (
    # Put strings here, like "/home/html/django_templates" or "C:/www/django/templates".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
    os.path.join(PROJECT_ROOT, "templates"),
    os.path.join(PROJECT_ROOT, "blog/templates"),   # overriding some default templates for the blog app
)

INSTALLED_APPS = (
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.messages',
    'django.contrib.comments',
    'django.contrib.markup',
    # Uncomment the next line to enable the admin:
    'django.contrib.admin',
    'basic.blog',
    'basic.inlines',
    'tagging',
    'base',
    'tablegame',
    'wordwalls',
    'registration',
    'accounts',
    'django.contrib.staticfiles',
    'gunicorn',
    'django_assets',
    'south',
    'whitleyCards',
    'quackleInterface',
    'crosswordgame',
    'misctools',
    'gargoyle',
    'nexus',
    'nsc2013',
    'flashcards'
    #'debug_toolbar',
    #'locking'
    # Uncomment the next line to enable admin documentation:
    # 'django.contrib.admindocs',
)
ACCOUNT_ACTIVATION_DAYS = 2
LOGIN_REDIRECT_URL = "/"

AUTH_PROFILE_MODULE = 'accounts.AerolithProfile'

EMAIL_HOST = "smtp.mailgun.org"
EMAIL_PORT = 587
EMAIL_HOST_USER = 'postmaster@aerolith.mailgun.org'
EMAIL_HOST_PASSWORD = settings_local.emailPw
EMAIL_USE_TLS = True
DEFAULT_FROM_EMAIL = 'webmaster@aerolith.mailgun.org'

LOGIN_URL = "/accounts/login"

STATICFILES_DIRS = (os.path.join(PROJECT_ROOT, 'static'),
                    os.path.join(PROJECT_ROOT, 'blog/static'),
                    )

IGNORABLE_404_ENDS = ('.php', '.cgi')
IGNORABLE_404_STARTS = ('/phpmyadmin/', '/forum/', '/favicon.ico', '/robots.txt')

SEND_BROKEN_LINK_EMAILS = False

INTERNAL_IPS = ('127.0.0.1',)
#
# DEBUG_TOOLBAR_PANELS = (
#
#     'debug_toolbar.panels.version.VersionDebugPanel',
#        'debug_toolbar.panels.timer.TimerDebugPanel',
#        'debug_toolbar.panels.settings_vars.SettingsVarsDebugPanel',
#        'debug_toolbar.panels.headers.HeaderDebugPanel',
#        'debug_toolbar.panels.request_vars.RequestVarsDebugPanel',
#        'debug_toolbar.panels.template.TemplateDebugPanel',
#        'debug_toolbar.panels.sql.SQLDebugPanel',
#        'debug_toolbar.panels.signals.SignalDebugPanel',
#        'debug_toolbar.panels.logger.LoggingPanel',
#
# )
#
# DEBUG_TOOLBAR_CONFIG = {
#         'INTERCEPT_REDIRECTS': False,
#    }

# import logging
# l = logging.getLogger('django.db.backends')
# l.setLevel(logging.DEBUG)
# l.addHandler(logging.StreamHandler())

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '%(levelname)s %(asctime)s %(module)s %(process)d %(message)s'
        },
        'simple': {
            'format': '%(levelname)s %(message)s'
        },
    },
    'handlers': {
        'null': {
            'level': 'DEBUG',
            'class': 'django.utils.log.NullHandler',
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'simple'
        },
        'log_file': {
            'level': 'DEBUG',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(os.getenv("HOME"), 'django.log'),
            'maxBytes': 50000000,
            'formatter': 'verbose',
            'backupCount': 10
        },
        'mail_admins': {
            'level': 'ERROR',
            'class': 'django.utils.log.AdminEmailHandler',
            'include_html': True,
        }
    },
    'loggers': {
        'django.db': {
            'handlers': ['log_file'],
            'level': 'INFO'
        },
        'django.request': {
            'handlers': ['mail_admins'],
            'level': 'ERROR',
            'propagate': True,
        },
        '': {
            'handlers': ['log_file', 'mail_admins'],
            'level': 'DEBUG',
            'propagate': True,
        }
    }
}
try:
    USE_MX = settings_local.USE_MX
except AttributeError:
    USE_MX = True
try:
    USE_GA = settings_local.USE_GA
except AttributeError:
    USE_GA = True
try:
    USE_FB = settings_local.USE_FB
except AttributeError:
    USE_FB = True
try:
    USE_UV = settings_local.USE_UV
except AttributeError:
    USE_UV = True
try:
    # Overwrite with settings_local's LOGGING if available.
    LOGGING = settings_local.LOGGING
except AttributeError:
    pass

ASSETS_DEBUG = settings_local.ASSETS_DEBUG
RECAPTCHA_PUBLIC_KEY = "6LctSMUSAAAAAAe-qMSIt5Y-iTw5hcFRsk2BPYl2"
RECAPTCHA_PRIVATE_KEY = settings_local.RECAPTCHA_PRIVATE_KEY

REDIS_HOST = settings_local.REDIS_HOST
REDIS_PORT = 6379
REDIS_SOCKET_TOKEN_DB = 2

SOCKJS_SERVER = settings_local.SOCKJS_SERVER

# See https://www.github.com/14domino/ujamaa
# General-purpose word tool.
UJAMAA_PATH = settings_local.UJAMAA_PATH

RECAPTCHA_SSL = settings_local.RECAPTCHA_SSL
