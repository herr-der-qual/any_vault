from rest_framework import serializers

from ..models.product import Product
from ..models.user import User, UserGroup
from ..models.brand import Brand
from ..models.category import Category
from ..models.flavor import Flavor
from .rating import RatingSerializer
from .comment import CommentSerializer
from ..models.rating import Rating
from ..models.comment import Comment


class ProductDetailSerializer(serializers.ModelSerializer):
    ratings = RatingSerializer(many=True, read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    category = serializers.StringRelatedField(read_only=True)
    brand = serializers.StringRelatedField(read_only=True)
    flavors = serializers.StringRelatedField(many=True, read_only=True)
    groups = serializers.StringRelatedField(many=True, read_only=True)

    class Meta:
        model = Product
        fields = '__all__'


class ProductSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating products with related objects"""
    category = serializers.CharField()
    brand = serializers.CharField(required=False, allow_blank=True)
    flavors = serializers.ListField(
        child=serializers.CharField(allow_blank=True),
        required=False,
        allow_empty=True
    )
    groups = serializers.ListField(
        child=serializers.CharField(allow_blank=True),
        required=False,
        allow_empty=True
    )
    telegram_id = serializers.IntegerField()
    username = serializers.CharField(required=False, allow_blank=True)
    # Nested create inputs
    ratings = serializers.ListField(
        child=serializers.DictField(), required=False, allow_empty=True
    )
    comments = serializers.ListField(
        child=serializers.DictField(), required=False, allow_empty=True
    )

    class Meta:
        model = Product
        fields = [
            'category', 'brand', 'variant', 'telegram_id', 'username',
            'flavors', 'groups', 'ratings', 'comments'
        ]

    def validate_category(self, value):
        if not value:
            raise serializers.ValidationError("Category is required")
        return value

    def validate_telegram_id(self, value):
        if not value:
            raise serializers.ValidationError("telegram_id is required")
        return value

    def create(self, validated_data):
        """Create product with related objects"""
        # Extract related data
        category_name = validated_data.pop('category')
        brand_name = validated_data.pop('brand', None)
        telegram_id = validated_data.pop('telegram_id')
        username = validated_data.pop('username', '')
        flavor_names = validated_data.pop('flavors', [])
        group_names = validated_data.pop('groups', [])
        rating_items = validated_data.pop('ratings', [])
        comment_items = validated_data.pop('comments', [])

        # Get or create category
        category, _ = Category.objects.get_or_create(name=category_name)

        # Get or create brand if provided
        brand = None
        if brand_name:
            brand, _ = Brand.objects.get_or_create(name=brand_name)

        # Get or create user
        user, _ = User.objects.get_or_create(
            telegram_id=telegram_id,
            defaults={'username': username}
        )

        # Create product
        product = Product.objects.create(
            category=category,
            brand=brand,
            user=user,
            **validated_data
        )

        # Add flavors
        for flavor_name in flavor_names:
            if flavor_name:  # Skip empty strings
                flavor, _ = Flavor.objects.get_or_create(name=flavor_name)
                product.flavors.add(flavor)

        # Add groups
        for group_name in group_names:
            if group_name:  # Skip empty strings
                group, _ = UserGroup.objects.get_or_create(name=group_name)
                product.groups.add(group)

        # Create or update ratings if provided
        for item in rating_items:
            try:
                user_for_rating, _ = User.objects.get_or_create(
                    telegram_id=item.get('telegram_id')
                )
                rating_value = item.get('rating')
                if rating_value is not None:
                    Rating.objects.update_or_create(
                        product=product,
                        user=user_for_rating,
                        defaults={'value': rating_value}
                    )
            except Exception:
                # Skip invalid rating items
                continue

        # Create comments if provided
        for item in comment_items:
            try:
                user_for_comment, _ = User.objects.get_or_create(
                    telegram_id=item.get('telegram_id')
                )
                comment_text = item.get('comment')
                if comment_text:
                    Comment.objects.create(
                        product=product,
                        user=user_for_comment,
                        text=comment_text
                    )
            except Exception:
                # Skip invalid comment items
                continue

        return product

    def update(self, instance, validated_data):
        """Update product with related objects"""
        # Extract related data
        category_name = validated_data.pop('category', None)
        brand_name = validated_data.pop('brand', None)
        flavor_names = validated_data.pop('flavors', None)
        group_names = validated_data.pop('groups', None)

        # Remove fields that shouldn't be updated directly
        validated_data.pop('telegram_id', None)
        validated_data.pop('username', None)

        # Update category if provided
        if category_name is not None:
            category, _ = Category.objects.get_or_create(name=category_name)
            instance.category = category

        # Update brand if provided
        if brand_name is not None:
            brand, _ = Brand.objects.get_or_create(name=brand_name)
            instance.brand = brand

        # Update flavors if provided
        if flavor_names is not None:
            instance.flavors.clear()
            for flavor_name in flavor_names:
                if flavor_name:  # Skip empty strings
                    flavor, _ = Flavor.objects.get_or_create(name=flavor_name)
                    instance.flavors.add(flavor)

        # Update groups if provided
        if group_names is not None:
            instance.groups.clear()
            for group_name in group_names:
                if group_name:  # Skip empty strings
                    group, _ = UserGroup.objects.get_or_create(name=group_name)
                    instance.groups.add(group)

        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        # Optionally process nested ratings/comments on update (append/update)
        rating_items = self.initial_data.get('ratings') if isinstance(self.initial_data, dict) else None
        if isinstance(rating_items, list):
            for item in rating_items:
                try:
                    user_for_rating, _ = User.objects.get_or_create(
                        telegram_id=item.get('telegram_id')
                    )
                    rating_value = item.get('rating')
                    if rating_value is not None:
                        Rating.objects.update_or_create(
                            product=instance,
                            user=user_for_rating,
                            defaults={'value': rating_value}
                        )
                except Exception:
                    continue

        comment_items = self.initial_data.get('comments') if isinstance(self.initial_data, dict) else None
        if isinstance(comment_items, list):
            for item in comment_items:
                try:
                    user_for_comment, _ = User.objects.get_or_create(
                        telegram_id=item.get('telegram_id')
                    )
                    comment_text = item.get('comment')
                    if comment_text:
                        Comment.objects.create(
                            product=instance,
                            user=user_for_comment,
                            text=comment_text
                        )
                except Exception:
                    continue

        return instance


