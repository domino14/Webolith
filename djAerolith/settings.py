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
        'ENGINE': 'django.db.backends.mysql',
        'NAME': settings_local.sql_db_name,
        'USER': settings_local.sqlUser,
        'PASSWORD': settings_local.sqlPw,
        'HOST': settings_local.SQL_HOST,
        'PORT': '',
        'TEST': {
            'CHARSET': 'utf8',
            'COLLATION': 'utf8_general_ci',
        },
        'OPTIONS': {
            "init_command": "SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED"
        },
        # I HATE YOU MYSQL I HATE YOU I SHOULDN'T NEED THIS OPTION.
        'ATOMIC_REQUESTS': True
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
    'middleware.session_expiry.SessionIdleTimeout',
    #'debug_toolbar.middleware.DebugToolbarMiddleware',
)

ROOT_URLCONF = 'urls'

PROJECT_ROOT = os.path.realpath(os.path.dirname(__file__))

TEMPLATE_DIRS = (
    # Put strings here, like "/home/html/django_templates" or "C:/www/django/templates".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
    os.path.join(PROJECT_ROOT, "templates"),
#    os.path.join(PROJECT_ROOT, "blog/templates"),   # overriding some default templates for the blog app
)

INSTALLED_APPS = (
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.messages',
    # Uncomment the next line to enable the admin:
    'django.contrib.admin',
    #'basic.blog',
    #'basic.inlines',
    'base',
    'tablegame',
    'wordwalls',
    'accounts',
    'django.contrib.staticfiles',
    'gunicorn',
    'whitleyCards',
    'gargoyle',
    'flashcards',
    'registration'
    #'debug_toolbar',
    #'locking'
    # Uncomment the next line to enable admin documentation:
    # 'django.contrib.admindocs',
)
ACCOUNT_ACTIVATION_DAYS = 2
LOGIN_REDIRECT_URL = "/"

EMAIL_HOST = "smtp.mailgun.org"
EMAIL_PORT = 587
EMAIL_HOST_USER = 'postmaster@aerolith.mailgun.org'
EMAIL_HOST_PASSWORD = settings_local.emailPw
EMAIL_USE_TLS = True
DEFAULT_FROM_EMAIL = 'webmaster@aerolith.mailgun.org'

LOGIN_URL = "/accounts/login"

STATICFILES_DIRS = (os.path.join(PROJECT_ROOT, 'static'),
#                    os.path.join(PROJECT_ROOT, 'blog/static'),
                    )

IGNORABLE_404_ENDS = ('.php', '.cgi')
IGNORABLE_404_STARTS = ('/phpmyadmin/', '/forum/', '/favicon.ico', '/robots.txt')

SEND_BROKEN_LINK_EMAILS = False

INTERNAL_IPS = ('127.0.0.1',)
from logging_filters import skip_suspicious_operations


LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'filters': {
        'skip_suspicious_operations': {
            '()': 'django.utils.log.CallbackFilter',
            'callback': skip_suspicious_operations,
        },
    },
    'formatters': {
        'verbose': {
            'format': '%(levelname)s %(asctime)s '
                      '[%(filename)s::%(funcName)s:%(lineno)s] %(message)s'
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
            'filters': ['skip_suspicious_operations']
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

RECAPTCHA_PUBLIC_KEY = "6LctSMUSAAAAAAe-qMSIt5Y-iTw5hcFRsk2BPYl2"
RECAPTCHA_PRIVATE_KEY = settings_local.RECAPTCHA_PRIVATE_KEY

REDIS_HOST = settings_local.REDIS_HOST
REDIS_PORT = 6379
REDIS_ALPHAGRAMS_DB = 0   # alphas to pks
REDIS_ALPHAGRAM_SOLUTIONS_DB = 1   # alpha_pks to solutions
REDIS_SOCKET_TOKEN_DB = 2


ALLOWED_HOSTS = ['.aerolith.org', '*']
SOCKJS_SERVER = settings_local.SOCKJS_SERVER

# See https://www.github.com/14domino/ujamaa
# General-purpose word tool.
UJAMAA_PATH = settings_local.UJAMAA_PATH

RECAPTCHA_SSL = settings_local.RECAPTCHA_SSL

# See SessionIdleTimeout middleware
SESSION_COOKIE_AGE = 60 * 60 * 24 * 30
SESSION_IDLE_TIMEOUT = SESSION_COOKIE_AGE
# This ensures session won't ever expire in the middle of a quiz.
# Also ask them to log in once a month.
SESSION_SERIALIZER = 'django.contrib.sessions.serializers.PickleSerializer'

AWS_ACCESS_KEY_ID = settings_local.AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY = settings_local.AWS_SECRET_ACCESS_KEY

WORD_DB_LOCATION = settings_local.WORD_DB_LOCATION

SAVE_LIST_LIMIT_NONMEMBER = 15000
SAVE_LIST_LIMIT_MEMBER = 5000000
WORDWALLS_QUESTIONS_PER_ROUND = 50

