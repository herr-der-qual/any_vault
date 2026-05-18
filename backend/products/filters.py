import django_filters

from .models.product import Product


class ProductFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(field_name='category__name', lookup_expr='icontains')
    brand = django_filters.CharFilter(field_name='brand__name', lookup_expr='icontains')
    flavor = django_filters.CharFilter(field_name='flavors__name', lookup_expr='icontains')
    group_id = django_filters.NumberFilter(field_name='groups__id')

    class Meta:
        model = Product
        fields = ['category', 'brand', 'flavor', 'group_id']
