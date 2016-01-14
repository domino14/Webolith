# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('wordwalls', '0006_auto_20160112_2330'),
    ]

    operations = [
        migrations.AlterField(
            model_name='wordwallsgamemodel',
            name='word_list',
            field=models.ForeignKey(default=1, to='base.WordList'),
            preserve_default=False,
        ),
        migrations.AlterUniqueTogether(
            name='dailychallengemissedbingos',
            unique_together=set([('alphagram_string', 'challenge')]),
        ),
    ]
