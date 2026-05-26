from django.contrib import admin

from .models.brand import Brand
from .models.category import Category
from .models.color import Color
from .models.flavor import Flavor
from .models.product import Product
from .models.rating import Rating
from .models.comment import Comment


@admin.register(Color)
class ColorAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'primary', 'secondary')


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'user')
    list_select_related = ('user',)
    search_fields = ('name', 'user__email')


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'user')
    list_select_related = ('user',)
    search_fields = ('name', 'user__email')


@admin.register(Flavor)
class FlavorAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'color', 'user')
    list_select_related = ('user', 'color')
    search_fields = ('name', 'user__email')


class RatingInline(admin.TabularInline):
    model = Rating
    extra = 0


class CommentInline(admin.TabularInline):
    model = Comment
    extra = 0


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('id', 'category', 'brand', 'variant', 'user')
    list_select_related = ('category', 'brand', 'user')
    list_filter = ('category', 'brand', 'flavors', 'groups')
    search_fields = ('variant', 'category__name', 'brand__name', 'user__email')
    filter_horizontal = ('flavors', 'groups')
    inlines = [RatingInline, CommentInline]


@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
    list_display = ('id', 'product', 'user', 'value')
    list_select_related = ('product', 'user')
    list_filter = ('value', 'product__category')
    search_fields = ('user__email', 'product__variant')


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('id', 'product', 'user', 'text')
    list_select_related = ('product', 'user')
    search_fields = ('text', 'user__email', 'product__variant')
