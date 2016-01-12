# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('wordwalls', '0002_wordwallsgamemodel_word_list'),
    ]

    operations = [
        migrations.AlterField(
            model_name='wordwallsgamemodel',
            name='curQuestions',
            field=models.TextField(null=True, blank=True),
        ),
        migrations.AlterField(
            model_name='wordwallsgamemodel',
            name='firstMissed',
            field=models.TextField(null=True, blank=True),
        ),
        migrations.AlterField(
            model_name='wordwallsgamemodel',
            name='missed',
            field=models.TextField(null=True, blank=True),
        ),
        migrations.AlterField(
            model_name='wordwallsgamemodel',
            name='numCurQuestions',
            field=models.IntegerField(null=True, blank=True),
        ),
        migrations.AlterField(
            model_name='wordwallsgamemodel',
            name='numFirstMissed',
            field=models.IntegerField(null=True, blank=True),
        ),
        migrations.AlterField(
            model_name='wordwallsgamemodel',
            name='numMissed',
            field=models.IntegerField(null=True, blank=True),
        ),
        migrations.AlterField(
            model_name='wordwallsgamemodel',
            name='numOrigQuestions',
            field=models.IntegerField(null=True, blank=True),
        ),
        migrations.AlterField(
            model_name='wordwallsgamemodel',
            name='origQuestions',
            field=models.TextField(null=True, blank=True),
        ),
    ]
