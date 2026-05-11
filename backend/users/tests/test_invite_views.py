from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from django.urls import reverse

from users.models import User, UserGroup, GroupMembership, GroupInvite


def make_user(email='user@example.com', **kwargs):
    return User.objects.create_user(username=email.split('@')[0], email=email, password='pass', **kwargs)


class GroupInviteSetupMixin:
    def setUp(self):
        self.admin = make_user('admin@example.com')
        self.member = make_user('member@example.com')
        self.outsider = make_user('outsider@example.com')

        self.group = UserGroup.objects.create(name='TestGroup')
        GroupMembership.objects.create(user=self.admin, group=self.group, role='admin')
        GroupMembership.objects.create(user=self.member, group=self.group, role='view_only')


class GroupInviteListViewTestCase(GroupInviteSetupMixin, APITestCase):
    def url(self):
        return reverse('group-invite-list', kwargs={'group_id': self.group.id})

    def test_admin_can_list(self):
        GroupInvite.objects.create(group=self.group, invited_by=self.admin, invite_type='email', email='x@x.com')
        self.client.force_authenticate(self.admin)

        response = self.client.get(self.url())

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_non_admin_member_gets_403(self):
        self.client.force_authenticate(self.member)

        response = self.client.get(self.url())

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_outsider_gets_403(self):
        self.client.force_authenticate(self.outsider)

        response = self.client.get(self.url())

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_gets_401(self):
        response = self.client.get(self.url())

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class GroupEmailInviteViewTestCase(GroupInviteSetupMixin, APITestCase):
    def url(self):
        return reverse('group-invite-email', kwargs={'group_id': self.group.id})

    def test_creates_invite(self):
        self.client.force_authenticate(self.admin)

        response = self.client.post(self.url(), {'email': 'new@example.com', 'role': 'view_only'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['email'], 'new@example.com')
        self.assertEqual(response.data['invite_type'], 'email')
        self.assertEqual(response.data['role'], 'view_only')
        self.assertTrue(GroupInvite.objects.filter(email='new@example.com', group=self.group).exists())

    def test_sets_invited_by(self):
        self.client.force_authenticate(self.admin)

        response = self.client.post(self.url(), {'email': 'new@example.com', 'role': 'view_only'}, format='json')

        self.assertEqual(response.data['invited_by_email'], self.admin.email)

    def test_missing_email_returns_400(self):
        self.client.force_authenticate(self.admin)

        response = self.client.post(self.url(), {'role': 'view_only'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_non_admin_gets_403(self):
        self.client.force_authenticate(self.member)

        response = self.client.post(self.url(), {'email': 'new@example.com', 'role': 'view_only'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class GroupBulkInviteViewTestCase(GroupInviteSetupMixin, APITestCase):
    def url(self):
        return reverse('group-invite-bulk', kwargs={'group_id': self.group.id})

    def test_creates_multiple_invites(self):
        self.client.force_authenticate(self.admin)
        emails = ['a@example.com', 'b@example.com', 'c@example.com']

        response = self.client.post(self.url(), {'emails': emails, 'role': 'view_only'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data), 3)

    def test_all_invites_share_bulk_id(self):
        self.client.force_authenticate(self.admin)
        emails = ['a@example.com', 'b@example.com']

        self.client.post(self.url(), {'emails': emails, 'role': 'view_only'}, format='json')

        invites = GroupInvite.objects.filter(group=self.group)
        bulk_ids = set(str(invite.bulk_id) for invite in invites)
        self.assertEqual(len(bulk_ids), 1)

    def test_empty_emails_returns_400(self):
        self.client.force_authenticate(self.admin)

        response = self.client.post(self.url(), {'emails': [], 'role': 'view_only'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class GroupQrInviteViewTestCase(GroupInviteSetupMixin, APITestCase):
    def url(self):
        return reverse('group-invite-qr', kwargs={'group_id': self.group.id})

    def test_creates_qr_invite(self):
        self.client.force_authenticate(self.admin)

        response = self.client.post(self.url(), {'role': 'view_only'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['invite_type'], 'qr')
        self.assertEqual(response.data['email'], '')

    def test_non_admin_gets_403(self):
        self.client.force_authenticate(self.member)

        response = self.client.post(self.url(), {'role': 'view_only'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class GroupInviteRevokeViewTestCase(GroupInviteSetupMixin, APITestCase):
    def setUp(self):
        super().setUp()
        self.invite = GroupInvite.objects.create(
            group=self.group,
            invited_by=self.admin,
            invite_type='email',
            email='target@example.com',
        )

    def url(self):
        return reverse('group-invite-revoke', kwargs={'group_id': self.group.id, 'invite_id': self.invite.id})

    def test_revokes_invite(self):
        self.client.force_authenticate(self.admin)

        response = self.client.post(self.url())

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.invite.refresh_from_db()
        self.assertTrue(self.invite.revoked)

    def test_already_revoked_returns_400(self):
        self.invite.revoked = True
        self.invite.save()
        self.client.force_authenticate(self.admin)

        response = self.client.post(self.url())

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_already_used_returns_400(self):
        self.invite.used = True
        self.invite.save()
        self.client.force_authenticate(self.admin)

        response = self.client.post(self.url())

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_non_admin_gets_403(self):
        self.client.force_authenticate(self.member)

        response = self.client.post(self.url())

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class GroupQrImageViewTestCase(GroupInviteSetupMixin, APITestCase):
    def setUp(self):
        super().setUp()
        self.invite = GroupInvite.objects.create(
            group=self.group,
            invited_by=self.admin,
            invite_type='qr',
        )

    def url(self):
        return reverse('group-invite-qr-image', kwargs={'group_id': self.group.id, 'token': str(self.invite.token)})

    def test_returns_png(self):
        self.client.force_authenticate(self.admin)

        response = self.client.get(self.url())

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'image/png')

    def test_non_admin_gets_403(self):
        self.client.force_authenticate(self.member)

        response = self.client.get(self.url())

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_email_invite_token_returns_404(self):
        email_invite = GroupInvite.objects.create(
            group=self.group,
            invited_by=self.admin,
            invite_type='email',
            email='x@x.com',
        )
        url = reverse('group-invite-qr-image', kwargs={'group_id': self.group.id, 'token': str(email_invite.token)})
        self.client.force_authenticate(self.admin)

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class JoinViewGetTestCase(GroupInviteSetupMixin, APITestCase):
    def setUp(self):
        super().setUp()
        self.invite = GroupInvite.objects.create(
            group=self.group,
            invited_by=self.admin,
            invite_type='qr',
        )

    def url(self):
        return reverse('invite-join', kwargs={'token': str(self.invite.token)})

    def test_returns_invite_info(self):
        response = self.client.get(self.url())

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['group_name'], self.group.name)
        self.assertEqual(response.data['role'], 'view_only')

    def test_used_invite_returns_410(self):
        self.invite.used = True
        self.invite.save()

        response = self.client.get(self.url())

        self.assertEqual(response.status_code, status.HTTP_410_GONE)

    def test_revoked_invite_returns_410(self):
        self.invite.revoked = True
        self.invite.save()

        response = self.client.get(self.url())

        self.assertEqual(response.status_code, status.HTTP_410_GONE)

    def test_expired_invite_returns_410(self):
        self.invite.expires_at = timezone.now() - timezone.timedelta(seconds=1)
        self.invite.save()

        response = self.client.get(self.url())

        self.assertEqual(response.status_code, status.HTTP_410_GONE)

    def test_nonexistent_token_returns_404(self):
        import uuid
        url = reverse('invite-join', kwargs={'token': str(uuid.uuid4())})

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class JoinViewPostTestCase(GroupInviteSetupMixin, APITestCase):
    def setUp(self):
        super().setUp()
        self.joiner = make_user('joiner@example.com')

    def _make_invite(self, invite_type='qr', email='', **kwargs):
        return GroupInvite.objects.create(
            group=self.group,
            invited_by=self.admin,
            invite_type=invite_type,
            email=email,
            **kwargs,
        )

    def url(self, invite):
        return reverse('invite-join', kwargs={'token': str(invite.token)})

    def test_qr_invite_joins_group(self):
        invite = self._make_invite()
        self.client.force_authenticate(self.joiner)

        response = self.client.post(self.url(invite))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(GroupMembership.objects.filter(user=self.joiner, group=self.group).exists())

    def test_join_marks_invite_used(self):
        invite = self._make_invite()
        self.client.force_authenticate(self.joiner)

        self.client.post(self.url(invite))

        invite.refresh_from_db()
        self.assertTrue(invite.used)
        self.assertEqual(invite.used_by, self.joiner)
        self.assertIsNotNone(invite.used_at)

    def test_email_invite_with_matching_email_joins(self):
        invite = self._make_invite(invite_type='email', email=self.joiner.email)
        self.client.force_authenticate(self.joiner)

        response = self.client.post(self.url(invite))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_email_invite_with_wrong_email_returns_403(self):
        invite = self._make_invite(invite_type='email', email='other@example.com')
        self.client.force_authenticate(self.joiner)

        response = self.client.post(self.url(invite))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_already_member_returns_400(self):
        invite = self._make_invite()
        self.client.force_authenticate(self.member)

        response = self.client.post(self.url(invite))

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_used_invite_returns_410(self):
        invite = self._make_invite(used=True)
        self.client.force_authenticate(self.joiner)

        response = self.client.post(self.url(invite))

        self.assertEqual(response.status_code, status.HTTP_410_GONE)

    def test_unauthenticated_returns_401(self):
        invite = self._make_invite()

        response = self.client.post(self.url(invite))

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invite_assigns_correct_role(self):
        invite = self._make_invite(role='moderator')
        self.client.force_authenticate(self.joiner)

        self.client.post(self.url(invite))

        membership = GroupMembership.objects.get(user=self.joiner, group=self.group)
        self.assertEqual(membership.role, 'moderator')


class ApplyPendingInvitesTestCase(APITestCase):
    def setUp(self):
        self.group = UserGroup.objects.create(name='AutoGroup')
        self.inviter = make_user('inviter@example.com')
        GroupMembership.objects.create(user=self.inviter, group=self.group, role='admin')

        self.user = make_user('pending@example.com')
        self.invite = GroupInvite.objects.create(
            group=self.group,
            invited_by=self.inviter,
            invite_type='email',
            email=self.user.email,
            role='view_only',
        )

    def test_login_applies_pending_email_invite(self):
        url = reverse('token-obtain')

        response = self.client.post(url, {'email': self.user.email, 'password': 'pass'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(GroupMembership.objects.filter(user=self.user, group=self.group).exists())
        self.invite.refresh_from_db()
        self.assertTrue(self.invite.used)

    def test_login_does_not_apply_expired_invite(self):
        self.invite.expires_at = timezone.now() - timezone.timedelta(seconds=1)
        self.invite.save()

        self.client.post(reverse('token-obtain'), {'email': self.user.email, 'password': 'pass'}, format='json')

        self.assertFalse(GroupMembership.objects.filter(user=self.user, group=self.group).exists())

    def test_login_does_not_apply_revoked_invite(self):
        self.invite.revoked = True
        self.invite.save()

        self.client.post(reverse('token-obtain'), {'email': self.user.email, 'password': 'pass'}, format='json')

        self.assertFalse(GroupMembership.objects.filter(user=self.user, group=self.group).exists())
