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


def tobool(val):
    if val is True:
        return True
    elif val is False:
        return False
    val = val.lower()
    if val in ('y', 'on', 'true', '1'):
        return True
    elif val in ('n', 'off', 'false', '0'):
        return False


DEBUG = tobool(os.environ.get('DEBUG'))
DEBUG_JS = tobool(os.environ.get('DEBUG_JS'))

ADMINS = (
    ('Cesar Del Solar', 'delsolar@gmail.com'),
)

MANAGERS = ADMINS

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': os.environ.get('PGSQL_DB_NAME'),
        'USER': os.environ.get('PGSQL_USER'),
        'PASSWORD': os.environ.get('PGSQL_PASSWORD'),
        'HOST': os.environ.get('PGSQL_HOST'),
        'PORT': '5432',
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
from django.utils.translation import ugettext_lazy as _
LANGUAGES = [
    ('en', _('English')),
    ('es', _('Spanish')),
]

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

STATIC_ROOT = os.environ.get('STATIC_ROOT')
STATIC_URL = '/static/'
# URL prefix for admin media -- CSS, JavaScript and images. Make sure to use a
# trailing slash.
# Examples: "http://foo.com/media/", "/media/".

ADMIN_MEDIA_PREFIX = '/static/admin/'

# Make this unique, and don't share it with anybody.
SECRET_KEY = os.environ.get('SECRET_KEY')

STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
)


MIDDLEWARE_CLASSES = (
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.locale.LocaleMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'social.apps.django_app.middleware.SocialAuthExceptionMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'middleware.session_expiry.SessionIdleTimeout',
    #'debug_toolbar.middleware.DebugToolbarMiddleware',
)

ROOT_URLCONF = 'urls'

PROJECT_ROOT = os.path.realpath(os.path.dirname(__file__))

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'APP_DIRS': True,
        'DIRS': [os.path.join(PROJECT_ROOT, 'templates')],
        'OPTIONS': {
            'context_processors': [
                'django.contrib.auth.context_processors.auth',
                'django.template.context_processors.debug',
                'django.template.context_processors.i18n',
                'django.template.context_processors.media',
                'django.template.context_processors.static',
                'django.template.context_processors.tz',
                'django.contrib.messages.context_processors.messages',
                'processors.maintenance.maintenance',
                'social.apps.django_app.context_processors.backends',
                'social.apps.django_app.context_processors.login_redirect',
            ]
        }
    },
]

LOCALE_PATHS = [
    os.path.join(PROJECT_ROOT, "locale"),
    os.path.join(PROJECT_ROOT, "base", "locale"),
    os.path.join(PROJECT_ROOT, "wordwalls", "locale"),
    os.path.join(PROJECT_ROOT, "accounts", "locale"),
]

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
    'flashcards',
    'tablegame',
    'wordwalls',
    'accounts',
    'django.contrib.staticfiles',
    'gunicorn',
    'whitleyCards',
    'gargoyle',
    'registration',
    'social.apps.django_app.default',
    #'debug_toolbar',
    #'locking'
    # Uncomment the next line to enable admin documentation:
    # 'django.contrib.admindocs',
)

AUTHENTICATION_BACKENDS = (
    'social.backends.google.GoogleOAuth2',
    'social.backends.facebook.FacebookOAuth2',
    'accounts.backends.CaseInsensitiveModelBackend',
)

SOCIAL_AUTH_PIPELINE = (
    'social.pipeline.social_auth.social_details',
    'social.pipeline.social_auth.social_uid',
    'social.pipeline.social_auth.auth_allowed',
    'social.pipeline.social_auth.social_user',
    'social.pipeline.user.get_username',
    'social.pipeline.social_auth.associate_by_email',
    'social.pipeline.user.create_user',
    'social.pipeline.social_auth.associate_user',
    'social.pipeline.social_auth.load_extra_data',
    'social.pipeline.user.user_details',
)

SOCIAL_AUTH_DISCONNECT_PIPELINE = (
    # Collects the social associations to disconnect.
    'social.pipeline.disconnect.get_entries',
    # Removes the social associations.
    'social.pipeline.disconnect.disconnect',
)

SOCIAL_AUTH_ADMIN_USER_SEARCH_FIELDS = ['username', 'first_name', 'email']

SOCIAL_AUTH_FACEBOOK_KEY = os.environ.get('SOCIAL_AUTH_FACEBOOK_KEY', '')
SOCIAL_AUTH_FACEBOOK_SECRET = os.environ.get('SOCIAL_AUTH_FACEBOOK_SECRET', '')

SOCIAL_AUTH_FACEBOOK_SCOPE = ['email']
SOCIAL_AUTH_FACEBOOK_PROFILE_EXTRA_PARAMS = {
    'fields': 'id, name, email'
}

SOCIAL_AUTH_GOOGLE_OAUTH2_KEY = os.environ.get(
    'SOCIAL_AUTH_GOOGLE_OAUTH2_KEY', '')
SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET = os.environ.get(
    'SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET', '')
SOCIAL_AUTH_GOOGLE_OAUTH_SCOPE = 'openid email'
SOCIAL_AUTH_NEW_USER_REDIRECT_URL = '/new_users/'
SOCIAL_AUTH_NEW_ASSOCIATION_REDIRECT_URL = '/accounts/social/'

ACCOUNT_ACTIVATION_DAYS = 2
LOGIN_REDIRECT_URL = "/"
LOGIN_ERROR_URL = '/login_error/'
EMAIL_HOST = "smtp.mailgun.org"
EMAIL_PORT = 587
EMAIL_HOST_USER = 'postmaster@aerolith.mailgun.org'
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_PW')
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
    'disable_existing_loggers': True,
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
        'mail_admins': {
            'level': 'ERROR',
            'class': 'django.utils.log.AdminEmailHandler',
            'include_html': True,
            'filters': ['skip_suspicious_operations']
        }
    },
    'loggers': {
        'django.db': {
            'handlers': ['console'],
            'level': 'INFO'
        },
        '': {   # catch-all
            'handlers': ['console', 'mail_admins'],
            'level': 'DEBUG'
        }
    }
}

if tobool(os.environ.get('PROD_LOGGING', False)):
    LOGGING['handlers']['log_file'].append({
        'level': 'DEBUG',
        'class': 'logging.handlers.RotatingFileHandler',
        'filename': os.path.join('/opt/logs', 'django.log'),
        'maxBytes': 50000000,
        'formatter': 'verbose',
        'backupCount': 10
    })
    LOGGING['loggers']['django.db'] = {
        'handlers': ['log_file'],
        'level': 'INFO'
    }
    LOGGING['loggers']['django.request'] = {
        'handlers': ['mail_admins'],
        'level': 'ERROR',
        'propagate': True,
    }
    LOGGING['loggers'][''] = {
        'handlers': ['log_file', 'mail_admins'],
        'level': 'DEBUG',
        'propagate': True,
    }
    LOGGING['disable_existing_loggers'] = False

USE_MX = tobool(os.environ.get('USE_MX'))
USE_GA = tobool(os.environ.get('USE_GA'))
USE_FB = tobool(os.environ.get('USE_FB'))
USE_UV = tobool(os.environ.get('USE_UV'))

# LOGGING config

NOCAPTCHA = tobool(os.environ.get('NOCAPTCHA', False))
RECAPTCHA_PUBLIC_KEY = "6LctSMUSAAAAAAe-qMSIt5Y-iTw5hcFRsk2BPYl2"
RECAPTCHA_PRIVATE_KEY = os.environ.get('RECAPTCHA_PRIVATE_KEY')

REDIS_HOST = os.environ.get('REDIS_HOST')   # not used.
REDIS_PORT = 6379
REDIS_ALPHAGRAMS_DB = 0   # alphas to pks
REDIS_ALPHAGRAM_SOLUTIONS_DB = 1   # alpha_pks to solutions
REDIS_SOCKET_TOKEN_DB = 2


ALLOWED_HOSTS = ['.aerolith.org', '*']
SOCKJS_SERVER = os.environ.get('SOCKJS_SERVER')   # not used.

RECAPTCHA_SSL = os.environ.get('RECAPTCHA_SSL')

# See SessionIdleTimeout middleware
SESSION_COOKIE_AGE = 60 * 60 * 24 * 30
SESSION_IDLE_TIMEOUT = SESSION_COOKIE_AGE
# This ensures session won't ever expire in the middle of a quiz.
# Also ask them to log in once a month.
SESSION_SERIALIZER = 'django.contrib.sessions.serializers.PickleSerializer'

AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')

WORD_DB_LOCATION = os.environ.get('WORD_DB_LOCATION')
# See github.com/domino14/macondo
# Tool used for generating blank bingos (and more in the future)
MACONDO_ADDRESS = os.environ.get('MACONDO_ADDRESS')

BACKUP_BUCKET_SUFFIX = os.environ.get('BACKUP_BUCKET_SUFFIX')

SAVE_LIST_LIMIT_NONMEMBER = 15000
SAVE_LIST_LIMIT_MEMBER = 5000000
WORDWALLS_QUESTIONS_PER_ROUND = 50
