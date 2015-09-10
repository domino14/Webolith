# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import accounts.models
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='AerolithProfile',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('coins', models.IntegerField(default=0)),
                ('profile', models.CharField(max_length=2000, blank=True)),
                ('rating', models.IntegerField(default=0)),
                ('member', models.BooleanField(default=False)),
                ('membershipType', models.IntegerField(default=0, choices=[(0, b'None'), (1, b'Bronze'), (2, b'Silver'), (3, b'Gold')])),
                ('membershipExpiry', models.DateTimeField(null=True, blank=True)),
                ('customWordwallsStyle', models.CharField(max_length=1000, blank=True)),
                ('wordwallsSaveListSize', models.IntegerField(default=0)),
                ('wordwallsMedals', models.TextField(null=True, blank=True)),
                ('avatarUrl', models.CharField(max_length=512, null=True, blank=True)),
                ('additional_data', models.TextField(default=b'{}', blank=True)),
                ('defaultLexicon', models.ForeignKey(default=accounts.models.getLexicon, to='base.Lexicon')),
                ('user', models.OneToOneField(to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
