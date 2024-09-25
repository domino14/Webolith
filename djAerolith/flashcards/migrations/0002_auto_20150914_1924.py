# -*- coding: utf-8 -*-


from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ("flashcards", "0001_initial"),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name="card",
            unique_together=set([]),
        ),
        migrations.RemoveField(
            model_name="card",
            name="alphagram",
        ),
        migrations.RemoveField(
            model_name="card",
            name="user",
        ),
        migrations.DeleteModel(
            name="Card",
        ),
    ]
