# Generated by Django 2.0.9 on 2019-01-25 04:58

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0010_auto_20190124_1902'),
    ]

    operations = [
        migrations.AlterField(
            model_name='savedlist',
            name='name',
            field=models.CharField(max_length=128),
        ),
    ]
