from .settings import *


INSTALLED_APPS.append('django_extensions')
INSTALLED_APPS.append('wait_for_db')

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'