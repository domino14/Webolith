# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('wordwalls', '0005_auto_20160112_0014'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='wordwallsgamemodel',
            name='curQuestions',
        ),
        migrations.RemoveField(
            model_name='wordwallsgamemodel',
            name='firstMissed',
        ),
        migrations.RemoveField(
            model_name='wordwallsgamemodel',
            name='missed',
        ),
        migrations.RemoveField(
            model_name='wordwallsgamemodel',
            name='numCurQuestions',
        ),
        migrations.RemoveField(
            model_name='wordwallsgamemodel',
            name='numFirstMissed',
        ),
        migrations.RemoveField(
            model_name='wordwallsgamemodel',
            name='numMissed',
        ),
        migrations.RemoveField(
            model_name='wordwallsgamemodel',
            name='numOrigQuestions',
        ),
        migrations.RemoveField(
            model_name='wordwallsgamemodel',
            name='origQuestions',
        ),
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
        migrations.RemoveField(
            model_name='dailychallengemissedbingos',
            name='alphagram',
        ),
    ]
