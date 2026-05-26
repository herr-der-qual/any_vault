from rest_framework import status
from rest_framework.test import APITestCase
from django.urls import reverse

from users.models import User
from products.models.color import Color


def make_user(email='user@example.com', **kwargs):
    return User.objects.create_user(username=email.split('@')[0], email=email, password='pass', **kwargs)


class ColorListViewTestCase(APITestCase):
    def setUp(self):
        self.user = make_user()
        self.color1 = Color.objects.create(name='Green', primary='#a5d6a7', secondary='#000000')
        self.color2 = Color.objects.create(name='Red', primary='#ef9a9a', secondary='#000000')
        self.url = reverse('color-list')

    def test_authenticated__returns_200(self):
        self.client.force_authenticate(self.user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_returns_all_colors(self):
        self.client.force_authenticate(self.user)

        response = self.client.get(self.url)

        self.assertEqual(len(response.data), 2)

    def test_returns_correct_fields(self):
        self.client.force_authenticate(self.user)

        response = self.client.get(self.url)

        color = next(c for c in response.data if c['id'] == self.color1.id)
        self.assertEqual(color['name'], 'Green')
        self.assertEqual(color['primary'], '#a5d6a7')
        self.assertEqual(color['secondary'], '#000000')

    def test_unauthenticated__returns_401(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ColorDetailViewTestCase(APITestCase):
    def setUp(self):
        self.user = make_user()
        self.color = Color.objects.create(name='Blue', primary='#64b5f6', secondary='#000000')
        self.url = reverse('color-detail', kwargs={'pk': self.color.pk})

    def test_authenticated__returns_200(self):
        self.client.force_authenticate(self.user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['primary'], '#64b5f6')

    def test_unauthenticated__returns_401(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_not_allowed(self):
        self.client.force_authenticate(self.user)

        response = self.client.post(reverse('color-list'), {'name': 'White', 'primary': '#fff', 'secondary': '#000'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_delete_not_allowed(self):
        self.client.force_authenticate(self.user)

        response = self.client.delete(self.url)

        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
