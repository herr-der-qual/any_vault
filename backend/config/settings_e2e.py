from .settings_dev import *


INSTALLED_APPS.append('e2e')
ROOT_URLCONF = 'config.urls_e2e'

EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'