# -*- coding: utf-8 -*-
# Generated by Django 1.11.1 on 2017-06-28 16:35


from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("wordwalls", "0012_auto_20170304_0055"),
    ]

    operations = [
        migrations.AddField(
            model_name="dailychallenge",
            name="category",
            field=models.CharField(
                choices=[("A", "Anagram"), ("B", "Build"), ("T", "Through")],
                default="A",
                max_length=2,
            ),
        ),
    ]
