from rest_framework import serializers

from ..models.rating import Rating
from ..models.product import Product
from ..models.user import User
from .user import UserSerializer


class RatingSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Rating
        fields = ['user', 'value']


class RatingCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating ratings"""
    product_id = serializers.IntegerField()
    telegram_id = serializers.IntegerField()
    rating = serializers.IntegerField(min_value=1, max_value=10)

    class Meta:
        model = Rating
        fields = ['product_id', 'telegram_id', 'rating']

    def validate(self, data):
        """Validate that product and user exist"""
        product_id = data.get('product_id')
        telegram_id = data.get('telegram_id')

        try:
            Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            raise serializers.ValidationError("Product not found")

        try:
            User.objects.get(telegram_id=telegram_id)
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found")

        return data

    def create(self, validated_data):
        """Create or update rating"""
        product_id = validated_data.pop('product_id')
        telegram_id = validated_data.pop('telegram_id')
        rating_value = validated_data.pop('rating')

        product = Product.objects.get(id=product_id)
        user = User.objects.get(telegram_id=telegram_id)

        rating, created = Rating.objects.update_or_create(
            product=product,
            user=user,
            defaults={'value': rating_value}
        )

        # Add a flag to indicate if the rating was created or updated
        rating._created = created
        return rating


