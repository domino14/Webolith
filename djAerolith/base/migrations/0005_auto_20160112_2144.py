# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('wordwalls', '0006_auto_20160112_2144'),
        ('base', '0004_auto_20160112_0014'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='alphagram',
            unique_together=set([]),
        ),
        migrations.RemoveField(
            model_name='alphagram',
            name='lexicon',
        ),
        migrations.RemoveField(
            model_name='word',
            name='alphagram',
        ),
        migrations.RemoveField(
            model_name='word',
            name='lexicon',
        ),
        migrations.AlterField(
            model_name='savedlist',
            name='version',
            field=models.IntegerField(default=2),
        ),
        migrations.DeleteModel(
            name='Alphagram',
        ),
        migrations.DeleteModel(
            name='Word',
        ),
    ]
