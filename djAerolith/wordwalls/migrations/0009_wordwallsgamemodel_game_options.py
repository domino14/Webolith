# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('wordwalls', '0008_auto_20160126_2057'),
    ]

    operations = [
        migrations.AddField(
            model_name='wordwallsgamemodel',
            name='game_options',
            field=models.CharField(default=b'{}', max_length=1024),
        ),
    ]
