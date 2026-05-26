from rest_framework import serializers

from ..models.brand import Brand
from ..models.category import Category
from ..models.color import Color
from ..models.flavor import Flavor


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ['id', 'name']


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']


class ColorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Color
        fields = ['id', 'name', 'primary', 'secondary']


class FlavorSerializer(serializers.ModelSerializer):
    color = ColorSerializer(read_only=True)

    class Meta:
        model = Flavor
        fields = ['id', 'name', 'color', 'user_id']
