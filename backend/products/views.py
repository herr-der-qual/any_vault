from django.db import models as db_models
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models.product import Product
from .models.rating import Rating
from .models.comment import Comment
from .models.brand import Brand
from .models.category import Category
from .models.flavor import Flavor
from .serializers import (
    ProductSerializer, ProductCreateSerializer, ProductListSerializer,
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
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer
    permission_classes = (IsAuthenticated, IsOwnerOrReadOnly)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = (IsAuthenticated, IsOwnerOrReadOnly)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class FlavorViewSet(viewsets.ModelViewSet):
    queryset = Flavor.objects.all()
    serializer_class = FlavorSerializer
    permission_classes = (IsAuthenticated, IsOwnerOrReadOnly)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class RatingViewSet(viewsets.ModelViewSet):
    queryset = Rating.objects.all()
    serializer_class = RatingSerializer
    permission_classes = (IsAuthenticated, CanEditPermission)


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = (IsAuthenticated, CanEditPermission)
