# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('wordwalls', '0009_dailychallengename_num_questions'),
    ]

    operations = [
        migrations.AlterField(
            model_name='wordwallsgamemodel',
            name='word_list',
            field=models.ForeignKey(to='base.WordList', null=True),
        ),
    ]
