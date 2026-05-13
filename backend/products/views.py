from django.db import models as db_models
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models.product import Product
from .models.rating import Rating
from .models.comment import Comment
from .models.brand import Brand
from .models.category import Category
from .models.flavor import Flavor
from .serializers import (
    ProductSerializer, ProductCreateSerializer, ProductListSerializer,
    BulkProductCreateSerializer,
    RatingSerializer, CommentSerializer,
    BrandSerializer, CategorySerializer, FlavorSerializer,
)
from .permissions import CanEditPermission, IsOwnerOrReadOnly, ProductPermission


class ProductViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated, ProductPermission)

    def get_queryset(self):
        user = self.request.user
        return Product.objects.filter(
            db_models.Q(user=user) | db_models.Q(groups__members=user)
        ).distinct()

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return ProductCreateSerializer
        return ProductSerializer

    def perform_create(self, serializer):
        serializer.save()


class BrandViewSet(viewsets.ModelViewSet):
    serializer_class = BrandSerializer
    permission_classes = (IsAuthenticated, IsOwnerOrReadOnly)

    def get_queryset(self):
        user = self.request.user
        return Brand.objects.filter(
            db_models.Q(user=None) | db_models.Q(user=user)
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = (IsAuthenticated, IsOwnerOrReadOnly)

    def get_queryset(self):
        user = self.request.user
        return Category.objects.filter(
            db_models.Q(user=None) | db_models.Q(user=user)
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class FlavorViewSet(viewsets.ModelViewSet):
    serializer_class = FlavorSerializer
    permission_classes = (IsAuthenticated, IsOwnerOrReadOnly)

    def get_queryset(self):
        user = self.request.user
        return Flavor.objects.filter(
            db_models.Q(user=None) | db_models.Q(user=user)
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class BulkProductCreateView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        serializer = BulkProductCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        flavors = data.get('flavors', [])
        groups = data.get('groups', [])
        entries = data['entries']

        created = []
        for entry in entries:
            product = Product.objects.create(
                user_id=entry['user_id'],
                category=data['category'],
                brand=data.get('brand'),
                variant=data.get('variant', ''),
            )
            product.flavors.set(flavors)
            product.groups.set(groups)

            if entry.get('rating') is not None:
                Rating.objects.create(product=product, user_id=entry['user_id'], value=entry['rating'])

            if entry.get('comment', '').strip():
                Comment.objects.create(product=product, user_id=entry['user_id'], text=entry['comment'])

            created.append({'id': product.id, 'user_id': entry['user_id']})

        return Response(created, status=201)


class RatingViewSet(viewsets.ModelViewSet):
    queryset = Rating.objects.all()
    serializer_class = RatingSerializer
    permission_classes = (IsAuthenticated, CanEditPermission)


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = (IsAuthenticated, CanEditPermission)
