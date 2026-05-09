from django.urls import path
from .views.products import ProductView, ProductRatingView, ProductCommentView

urlpatterns = [
    path('products/', ProductView.as_view(), name='product-list'),
    path('products/<int:product_id>/', ProductView.as_view(), name='product-detail'),
    path('products/ratings/', ProductRatingView.as_view(), name='product-rating'),
    path('products/comments/', ProductCommentView.as_view(), name='product-comment'),
]

