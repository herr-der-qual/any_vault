from rest_framework import serializers

from ..models.product import Product
from ..models.rating import Rating
from ..models.comment import Comment
from ..models.brand import Brand
from ..models.category import Category
from ..models.flavor import Flavor
from users.models import UserGroup
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
    flavors = serializers.SerializerMethodField()
    ratings = serializers.SerializerMethodField()
    comments = serializers.SerializerMethodField()
    category_id = serializers.SerializerMethodField()
    brand_id = serializers.SerializerMethodField()
    flavor_ids = serializers.SerializerMethodField()

    def get_flavors(self, obj):
        result = []
        for f in obj.flavors.all():
            color = None
            if f.color_id:
                color = {
                    'id': f.color.id,
                    'primary': f.color.primary,
                    'secondary': f.color.secondary,
                }
            result.append({'name': f.name, 'color': color})
        return result

    def get_ratings(self, obj):
        return [{'user_id': r.user_id, 'value': r.value} for r in obj.ratings.all()]

    def get_comments(self, obj):
        return [{'user_id': c.user_id, 'text': c.text} for c in obj.comments.all()]

    def get_category_id(self, obj):
        return obj.category_id

    def get_brand_id(self, obj):
        return obj.brand_id

    def get_flavor_ids(self, obj):
        return [f.id for f in obj.flavors.all()]

    class Meta:
        model = Product
        fields = ['id', 'category', 'category_id', 'brand', 'brand_id', 'variant', 'flavors', 'flavor_ids', 'ratings', 'comments', 'image']


class RatingInputSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    value = serializers.IntegerField(min_value=1, max_value=10, allow_null=True, required=False)


class CommentInputSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    text = serializers.CharField(allow_blank=True, default='')


class ProductCreateSerializer(serializers.ModelSerializer):
    ratings = RatingInputSerializer(many=True, required=False, write_only=True)
    comments = CommentInputSerializer(many=True, required=False, write_only=True)

    class Meta:
        model = Product
        fields = ['id', 'category', 'brand', 'variant', 'flavors', 'groups', 'description', 'image', 'ratings', 'comments']
        extra_kwargs = {
            'flavors': {'required': False},
            'groups': {'required': False},
        }

    def create(self, validated_data):
        flavors = validated_data.pop('flavors', [])
        groups = validated_data.pop('groups', [])
        ratings_data = validated_data.pop('ratings', [])
        comments_data = validated_data.pop('comments', [])

        product = Product.objects.create(user=self.context['request'].user, **validated_data)
        product.flavors.set(flavors)
        product.groups.set(groups)

        for r in ratings_data:
            if r.get('value') is not None:
                Rating.objects.create(product=product, user_id=r['user_id'], value=r['value'])

        for c in comments_data:
            if c.get('text', '').strip():
                Comment.objects.create(product=product, user_id=c['user_id'], text=c['text'])

        return product

    def update(self, instance, validated_data):  # noqa: used by ModelViewSet
        flavors = validated_data.pop('flavors', None)
        groups = validated_data.pop('groups', None)
        if flavors is not None:
            instance.flavors.set(flavors)
        if groups is not None:
            instance.groups.set(groups)
        return super().update(instance, validated_data)


class BulkEntrySerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    rating = serializers.IntegerField(min_value=1, max_value=10, allow_null=True, required=False)
    comment = serializers.CharField(allow_blank=True, default='')


class BulkProductCreateSerializer(serializers.Serializer):
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all())
    brand = serializers.PrimaryKeyRelatedField(queryset=Brand.objects.all(), required=False, allow_null=True)
    variant = serializers.CharField(max_length=64, allow_blank=True, default='')
    flavors = serializers.PrimaryKeyRelatedField(queryset=Flavor.objects.all(), many=True, required=False)
    groups = serializers.PrimaryKeyRelatedField(queryset=UserGroup.objects.all(), many=True, required=False)
    entries = BulkEntrySerializer(many=True, min_length=1)
