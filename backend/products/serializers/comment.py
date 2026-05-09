from rest_framework import serializers

from ..models.comment import Comment
from ..models.product import Product
from ..models.user import User
from .user import UserSerializer


class CommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ['user', 'text']


class CommentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating comments"""
    product_id = serializers.IntegerField()
    telegram_id = serializers.IntegerField()
    comment = serializers.CharField()

    class Meta:
        model = Comment
        fields = ['product_id', 'telegram_id', 'comment']

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
        """Create comment"""
        product_id = validated_data.pop('product_id')
        telegram_id = validated_data.pop('telegram_id')
        comment_text = validated_data.pop('comment')

        product = Product.objects.get(id=product_id)
        user = User.objects.get(telegram_id=telegram_id)

        comment = Comment.objects.create(
            product=product,
            user=user,
            text=comment_text
        )

        return comment


