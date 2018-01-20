# -*- coding: utf-8 -*-


from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='WordList',
            fields=[
            ],
            options={
                'proxy': True,
            },
            bases=('base.savedlist',),
        ),
        migrations.AddField(
            model_name='savedlist',
            name='is_temporary',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='savedlist',
            name='version',
            field=models.IntegerField(default=1),
        ),
    ]
