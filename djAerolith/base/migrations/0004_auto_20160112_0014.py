# -*- coding: utf-8 -*-


from django.db import models, migrations
import base.validators


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0003_auto_20151001_0908'),
    ]

    operations = [
        migrations.AlterField(
            model_name='savedlist',
            name='origQuestions',
            field=models.TextField(validators=[base.validators.word_list_format_validator]),
        ),
    ]
