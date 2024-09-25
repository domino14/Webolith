# -*- coding: utf-8 -*-


from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("wordwalls", "0011_remove_dailychallengeleaderboardentry_additionaldata"),
    ]

    operations = [
        migrations.AlterField(
            model_name="wordwallsgamemodel",
            name="word_list",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.SET_NULL,
                to="base.WordList",
                null=True,
            ),
        ),
    ]
