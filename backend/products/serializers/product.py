from rest_framework import serializers

from ..models.product import Product
from .rating import RatingSerializer
from .comment import CommentSerializer


class ProductSerializer(serializers.ModelSerializer):
    ratings = RatingSerializer(many=True, read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    category = serializers.StringRelatedField()
    brand = serializers.StringRelatedField()
    flavors = serializers.StringRelatedField(many=True)
    groups = serializers.StringRelatedField(many=True)

    class Meta:
        model = Product
        fields = '__all__'


class ProductListSerializer(serializers.ModelSerializer):
    category = serializers.StringRelatedField()
    brand = serializers.StringRelatedField()
    flavors = serializers.StringRelatedField(many=True)

    class Meta:
        model = Product
        fields = ['id', 'category', 'brand', 'variant', 'flavors', 'image']


class ProductCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'category', 'brand', 'variant', 'flavors', 'groups', 'description', 'image']
        extra_kwargs = {
            'flavors': {'required': False},
            'groups': {'required': False},
        }

    def create(self, validated_data):
        flavors = validated_data.pop('flavors', [])
        groups = validated_data.pop('groups', [])
        product = Product.objects.create(user=self.context['request'].user, **validated_data)
        product.flavors.set(flavors)
        product.groups.set(groups)
        return product

    def update(self, instance, validated_data):
        flavors = validated_data.pop('flavors', None)
        groups = validated_data.pop('groups', None)
        if flavors is not None:
            instance.flavors.set(flavors)
        if groups is not None:
            instance.groups.set(groups)
        return super().update(instance, validated_data)
