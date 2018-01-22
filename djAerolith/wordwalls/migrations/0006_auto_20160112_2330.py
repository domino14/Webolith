# -*- coding: utf-8 -*-


from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('wordwalls', '0005_auto_20160112_0014'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='dailychallengemissedbingos',
            name='alphagram',
        ),
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
    ]
