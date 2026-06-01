from django.db import models as db_models
from django.db.models import IntegerField, OuterRef, Subquery
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend

from .filters import ProductFilter
from .models.product import Product
from .models.rating import Rating
from .models.comment import Comment
from .models.brand import Brand
from .models.category import Category
from .models.color import Color
from .models.flavor import Flavor
from .models.table_view import TableView
from .serializers import (
    ProductSerializer, ProductCreateSerializer, ProductListSerializer,
    BulkProductCreateSerializer,
    RatingSerializer, CommentSerializer,
    BrandSerializer, CategorySerializer, ColorSerializer, FlavorSerializer,
    TableViewSerializer,
)
from users.models import UserGroup, GroupMembership
from .permissions import CanEditPermission, IsGroupMemberOrReadOnly, ProductPermission


class ProductPagination(LimitOffsetPagination):
    default_limit = 100
    max_limit = 100


_STATIC_ORDER_FIELDS = {'category__name', 'brand__name', 'variant'}
_DEFAULT_ORDERING = ['category__name', 'brand__name']


class ProductViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated, ProductPermission)
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_class = ProductFilter
    search_fields = ['brand__name', 'category__name', 'flavors__name', 'variant']
    pagination_class = ProductPagination

    def get_queryset(self):
        user = self.request.user
        qs = Product.objects.filter(
            db_models.Q(user=user) | db_models.Q(groups__members=user)
        ).distinct().prefetch_related('flavors__color', 'ratings', 'comments', 'groups')

        ordering_param = self.request.query_params.get('ordering', '')
        ordering = []
        for part in ordering_param.split(','):
            part = part.strip()
            if not part:
                continue
            field = part.lstrip('-')
            prefix = '-' if part.startswith('-') else ''
            if field in _STATIC_ORDER_FIELDS:
                ordering.append(f'{prefix}{field}')
            elif field == 'my_rating':
                qs = qs.annotate(
                    my_rating=Subquery(
                        Rating.objects.filter(product=OuterRef('pk'), user=user).values('value')[:1],
                        output_field=IntegerField(),
                    )
                )
                ordering.append(f'{prefix}my_rating')
            elif field.startswith('rating_') and field[7:].isdigit():
                uid = int(field[7:])
                qs = qs.annotate(**{
                    field: Subquery(
                        Rating.objects.filter(product=OuterRef('pk'), user_id=uid).values('value')[:1],
                        output_field=IntegerField(),
                    )
                })
                ordering.append(f'{prefix}{field}')

        return qs.order_by(*(ordering or _DEFAULT_ORDERING))

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return ProductCreateSerializer
        return ProductSerializer

    def perform_create(self, serializer):
        serializer.save()

    def _resolve_target_user_id(self, request, product):
        from users.models import GroupMembership
        raw = request.data.get('user_id')
        if raw is None or int(raw) == request.user.id:
            return request.user.id, None
        group_ids = product.groups.values_list('id', flat=True)
        ok = GroupMembership.objects.filter(
            user=request.user, group_id__in=group_ids, role__in=['admin', 'moderator']
        ).exists()
        if not ok:
            return None, Response({'detail': 'Permission denied.'}, status=403)
        return int(raw), None

    @action(detail=True, methods=['post'])
    def rate(self, request, pk=None):
        product = self.get_object()
        target_user_id, err = self._resolve_target_user_id(request, product)
        if err:
            return err
        value = request.data.get('value')
        if value is None:
            Rating.objects.filter(product=product, user_id=target_user_id).delete()
        else:
            Rating.objects.update_or_create(
                product=product, user_id=target_user_id, defaults={'value': int(value)}
            )
        return Response(status=204)

    @action(detail=True, methods=['post'])
    def comment(self, request, pk=None):
        product = self.get_object()
        target_user_id, err = self._resolve_target_user_id(request, product)
        if err:
            return err
        text = request.data.get('text', '').strip()
        if text:
            Comment.objects.update_or_create(
                product=product, user_id=target_user_id, defaults={'text': text}
            )
        else:
            Comment.objects.filter(product=product, user_id=target_user_id).delete()
        return Response(status=204)


class ColorViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ColorSerializer
    permission_classes = (IsAuthenticated,)
    queryset = Color.objects.all()


class BrandViewSet(viewsets.ModelViewSet):
    serializer_class = BrandSerializer
    permission_classes = (IsAuthenticated, IsGroupMemberOrReadOnly)

    def get_queryset(self):
        user_groups = UserGroup.objects.filter(members=self.request.user)
        return Brand.objects.filter(
            db_models.Q(group=None) | db_models.Q(group__in=user_groups)
        )

    def perform_create(self, serializer):
        group_id = self.request.data.get('group_id') or None
        serializer.save(group_id=group_id)


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = (IsAuthenticated, IsGroupMemberOrReadOnly)

    def get_queryset(self):
        user_groups = UserGroup.objects.filter(members=self.request.user)
        return Category.objects.filter(
            db_models.Q(group=None) | db_models.Q(group__in=user_groups)
        )

    def perform_create(self, serializer):
        group_id = self.request.data.get('group_id') or None
        serializer.save(group_id=group_id)


class FlavorViewSet(viewsets.ModelViewSet):
    serializer_class = FlavorSerializer
    permission_classes = (IsAuthenticated, IsGroupMemberOrReadOnly)

    def get_queryset(self):
        user_groups = UserGroup.objects.filter(members=self.request.user)
        return Flavor.objects.filter(
            db_models.Q(group=None) | db_models.Q(group__in=user_groups)
        )

    def perform_create(self, serializer):
        group_id = self.request.data.get('group_id') or None
        serializer.save(group_id=group_id)

    @action(detail=True, methods=['patch'])
    def set_color(self, request, pk=None):
        user_groups = UserGroup.objects.filter(members=request.user)
        qs = Flavor.objects.filter(
            db_models.Q(group=None) | db_models.Q(group__in=user_groups)
        )
        flavor = get_object_or_404(qs, pk=pk)
        color_id = request.data.get('color_id')
        flavor.color_id = color_id if color_id is not None else None
        flavor.save(update_fields=['color_id'])
        return Response({'id': flavor.id, 'color_id': flavor.color_id})


class BulkProductCreateView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        serializer = BulkProductCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        flavors = data.get('flavors', [])
        groups = data.get('groups', [])
        entries = data['entries']

        product = Product.objects.create(
            user=request.user,
            category=data['category'],
            brand=data.get('brand'),
            variant=data.get('variant', ''),
            no_sugar=data.get('no_sugar', False),
        )
        product.flavors.set(flavors)
        product.groups.set(groups)

        for entry in entries:
            if entry.get('rating') is not None:
                Rating.objects.create(product=product, user_id=entry['user_id'], value=entry['rating'])
            if entry.get('comment', '').strip():
                Comment.objects.create(product=product, user_id=entry['user_id'], text=entry['comment'])

        return Response({'id': product.id}, status=201)


class TableViewViewSet(viewsets.ModelViewSet):
    serializer_class = TableViewSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        group_id = self.request.query_params.get('group_id')
        queryset = TableView.objects.filter(group__members=self.request.user)
        if group_id:
            queryset = queryset.filter(group_id=group_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class RatingViewSet(viewsets.ModelViewSet):
    queryset = Rating.objects.all()
    serializer_class = RatingSerializer
    permission_classes = (IsAuthenticated, CanEditPermission)


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = (IsAuthenticated, CanEditPermission)
