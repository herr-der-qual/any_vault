from rest_framework import serializers

from ..models.table_view import TableView


class TableViewSerializer(serializers.ModelSerializer):
    class Meta:
        model = TableView
        fields = ['id', 'name', 'group', 'config', 'is_default', 'order', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
