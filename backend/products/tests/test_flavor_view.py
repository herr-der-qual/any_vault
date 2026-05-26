from rest_framework import status
from rest_framework.test import APITestCase
from django.urls import reverse

from users.models import User
from products.models.color import Color
from products.models.flavor import Flavor


def make_user(email='user@example.com', **kwargs):
    return User.objects.create_user(username=email.split('@')[0], email=email, password='pass', **kwargs)


class FlavorSetColorTestCase(APITestCase):
    def setUp(self):
        self.user = make_user()
        self.flavor = Flavor.objects.create(name='Watermelon')
        self.color = Color.objects.create(name='Red', primary='#ef9a9a', secondary='#000000')
        self.url = reverse('flavor-set-color', kwargs={'pk': self.flavor.pk})

    def test_sets_color(self):
        self.client.force_authenticate(self.user)

        response = self.client.patch(self.url, {'color_id': self.color.id}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.flavor.refresh_from_db()
        self.assertEqual(self.flavor.color_id, self.color.id)

    def test_clears_color_with_null(self):
        self.flavor.color = self.color
        self.flavor.save()
        self.client.force_authenticate(self.user)

        response = self.client.patch(self.url, {'color_id': None}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.flavor.refresh_from_db()
        self.assertIsNone(self.flavor.color_id)

    def test_response_contains_color_id(self):
        self.client.force_authenticate(self.user)

        response = self.client.patch(self.url, {'color_id': self.color.id}, format='json')

        self.assertEqual(response.data['id'], self.flavor.id)
        self.assertEqual(response.data['color_id'], self.color.id)

    def test_unauthenticated__returns_401(self):
        response = self.client.patch(self.url, {'color_id': self.color.id}, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_other_user_can_set_color_on_global_flavor(self):
        other_user = make_user('other@example.com')
        self.client.force_authenticate(other_user)

        response = self.client.patch(self.url, {'color_id': self.color.id}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_cannot_set_color_on_another_users_flavor(self):
        owner = make_user('owner@example.com')
        other = make_user('other@example.com')
        private_flavor = Flavor.objects.create(name='Private', user=owner)
        url = reverse('flavor-set-color', kwargs={'pk': private_flavor.pk})
        self.client.force_authenticate(other)

        response = self.client.patch(url, {'color_id': self.color.id}, format='json')

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
