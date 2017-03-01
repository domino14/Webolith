# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('wordwalls', '0009_dailychallengename_num_questions'),
    ]

    operations = [
        migrations.CreateModel(
            name='Medal',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('medal_type', models.CharField(max_length=2, choices=[(b'B', b'Bronze'), (b'S', b'Silver'), (b'G', b'Gold'), (b'PS', b'Platinum'), (b'GS', b'GoldStar')])),
                ('lb_entry', models.OneToOneField(to='wordwalls.DailyChallengeLeaderboardEntry')),
            ],
        ),
    ]
