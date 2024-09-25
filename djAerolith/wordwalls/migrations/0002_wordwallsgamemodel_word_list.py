# -*- coding: utf-8 -*-


from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ("base", "0002_auto_20150914_2227"),
        ("wordwalls", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="wordwallsgamemodel",
            name="word_list",
            field=models.ForeignKey(
                to="base.WordList", null=True, on_delete=models.SET_NULL
            ),
        ),
    ]
