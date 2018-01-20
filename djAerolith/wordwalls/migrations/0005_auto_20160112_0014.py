# -*- coding: utf-8 -*-


from django.db import models, migrations
import base.validators


class Migration(migrations.Migration):

    dependencies = [
        ('wordwalls', '0004_auto_20151016_1822'),
    ]

    operations = [
        migrations.AlterField(
            model_name='namedlist',
            name='questions',
            field=models.TextField(validators=[base.validators.named_list_format_validator]),
        ),
    ]
