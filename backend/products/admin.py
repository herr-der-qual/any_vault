from django.contrib import admin

from .models.category import Category
from .models.product import Product
from .models.flavor import Flavor
from .models.user import User, UserGroup
from .models.rating import Rating
from .models.comment import Comment


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)


@admin.register(Flavor)
class FlavorAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('id', 'telegram_id', 'username', 'role')
    search_fields = ('telegram_id', 'username')
    list_filter = ('role',)


@admin.register(UserGroup)
class UserGroupAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)
    filter_horizontal = ('members',)


class RatingInline(admin.TabularInline):
    model = Rating
    extra = 0


class CommentInline(admin.TabularInline):
    model = Comment
    extra = 0


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('id', 'category', 'variant', 'user')
    list_select_related = ('category', 'user')
    list_filter = ('category', 'flavors', 'groups')
    search_fields = ('variant', 'category__name', 'user__telegram_id', 'user__username')
    filter_horizontal = ('flavors', 'groups')
    inlines = [RatingInline, CommentInline]


@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
    list_display = ('id', 'product', 'user', 'value')
    list_select_related = ('product', 'user')
    list_filter = ('value', 'product__category')
    search_fields = ('user__telegram_id', 'user__username', 'product__variant')


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('id', 'product', 'user', 'text')
    list_select_related = ('product', 'user')
    search_fields = ('text', 'user__telegram_id', 'user__username', 'product__variant')
