from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0003_flavor_add_color'),
    ]

    operations = [
        migrations.RunSQL(
            sql='ALTER TABLE products_flavor DROP COLUMN color',
            reverse_sql='ALTER TABLE products_flavor ADD COLUMN color varchar(16) NOT NULL DEFAULT \'\'',
        ),
    ]
