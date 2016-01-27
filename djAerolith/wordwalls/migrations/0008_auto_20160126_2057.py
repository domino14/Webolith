# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('wordwalls', '0007_auto_20160113_0944'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='dailychallengemissedbingos',
            options={'verbose_name': 'Daily Challenge Missed Bingo', 'verbose_name_plural': 'Daily Challenge Missed Bingos'},
        ),
    ]
