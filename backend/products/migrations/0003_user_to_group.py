import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0001_initial'),
        ('users', '0001_initial'),
    ]

    operations = [
        # Brand: user -> group
        migrations.AlterUniqueTogether(name='brand', unique_together=set()),
        migrations.RemoveField(model_name='brand', name='user'),
        migrations.AddField(
            model_name='brand',
            name='group',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='brands', to='users.usergroup'),
        ),
        migrations.AlterField(model_name='brand', name='name', field=models.CharField(max_length=32)),
        migrations.AlterUniqueTogether(name='brand', unique_together={('name', 'group')}),

        # Category: user -> group
        migrations.AlterUniqueTogether(name='category', unique_together=set()),
        migrations.RemoveField(model_name='category', name='user'),
        migrations.AddField(
            model_name='category',
            name='group',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='categories', to='users.usergroup'),
        ),
        migrations.AlterField(model_name='category', name='name', field=models.CharField(max_length=32)),
        migrations.AlterUniqueTogether(name='category', unique_together={('name', 'group')}),

        # Flavor: user -> group
        migrations.AlterUniqueTogether(name='flavor', unique_together=set()),
        migrations.RemoveField(model_name='flavor', name='user'),
        migrations.AddField(
            model_name='flavor',
            name='group',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='flavors', to='users.usergroup'),
        ),
        migrations.AlterField(model_name='flavor', name='name', field=models.CharField(max_length=32)),
        migrations.AlterUniqueTogether(name='flavor', unique_together={('name', 'group')}),
    ]
