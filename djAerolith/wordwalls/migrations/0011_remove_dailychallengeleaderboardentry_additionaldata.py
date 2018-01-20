# -*- coding: utf-8 -*-


from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('wordwalls', '0010_auto_20170301_0923'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='dailychallengeleaderboardentry',
            name='additionalData',
        ),
    ]
