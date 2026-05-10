from django.urls import include, path

from config.urls import urlpatterns


urlpatterns = urlpatterns + [
    path('', include('e2e.urls')),
]