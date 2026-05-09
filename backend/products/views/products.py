from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404

from ..models.product import Product
from ..serializers import (
    ProductDetailSerializer,
    ProductSerializer
)


class ProductView(APIView):
    permission_classes = [AllowAny]  # Allow bot requests without authentication

    def get(self, request):
        """Get products with optional filtering"""
        products = Product.objects.select_related('category', 'user').prefetch_related(
            'flavors', 'groups', 'ratings__user', 'comments__user'
        ).all()

        # Filter by category if provided
        category_name = request.query_params.get('category')
        if category_name:
            products = products.filter(category__name__icontains=category_name)

        # Filter by user group if provided
        group_name = request.query_params.get('group')
        if group_name:
            products = products.filter(groups__name__icontains=group_name)

        serializer = ProductDetailSerializer(products, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Create a new product (used by bot)"""
        serializer = ProductSerializer(data=request.data)
        if serializer.is_valid():
            product = serializer.save()
            response_serializer = ProductDetailSerializer(product)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, product_id=None):
        """Update an existing product"""
        if not product_id:
            return Response(
                {'error': 'Product ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        product = get_object_or_404(Product, id=product_id)
        serializer = ProductSerializer(product, data=request.data, partial=True)
        if serializer.is_valid():
            product = serializer.save()
            response_serializer = ProductDetailSerializer(product)
            return Response(response_serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, product_id=None):
        """Delete a product"""
        if not product_id:
            return Response(
                {'error': 'Product ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        product = get_object_or_404(Product, id=product_id)
        product.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProductRatingView(APIView):
    """Handle product ratings from bot users"""
    permission_classes = [AllowAny]

    def post(self, request):
        """Add or update a rating for a product"""
        from ..serializers import RatingCreateUpdateSerializer

        serializer = RatingCreateUpdateSerializer(data=request.data)
        if serializer.is_valid():
            rating = serializer.save()
            action = 'created' if hasattr(rating, '_created') and rating._created else 'updated'
            return Response({
                'message': f'Rating {action} successfully',
                'rating': rating.value,
                'user': rating.user.telegram_id
            }, status=status.HTTP_201_CREATED if hasattr(rating, '_created') and rating._created else status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProductCommentView(APIView):
    """Handle product comments from bot users"""
    permission_classes = [AllowAny]

    def post(self, request):
        """Add a comment to a product"""
        from ..serializers import CommentCreateSerializer

        serializer = CommentCreateSerializer(data=request.data)
        if serializer.is_valid():
            comment = serializer.save()
            return Response({
                'message': 'Comment added successfully',
                'comment_id': comment.id,
                'user': comment.user.telegram_id
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
