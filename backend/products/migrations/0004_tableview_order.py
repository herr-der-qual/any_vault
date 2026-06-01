from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0003_product_no_sugar'),
    ]

    operations = [
        migrations.AddField(
            model_name='tableview',
            name='order',
            field=models.IntegerField(default=0),
        ),
    ]
