from rest_framework.routers import DefaultRouter
from .views import (
    ProductViewSet, RatingViewSet, CommentViewSet,
    BrandViewSet, CategoryViewSet, FlavorViewSet,
)

router = DefaultRouter()
router.register('products', ProductViewSet, basename='product')
router.register('ratings', RatingViewSet, basename='rating')
router.register('comments', CommentViewSet, basename='comment')
router.register('brands', BrandViewSet, basename='brand')
router.register('categories', CategoryViewSet, basename='category')
router.register('flavors', FlavorViewSet, basename='flavor')

urlpatterns = router.urls
