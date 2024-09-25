# -*- coding: utf-8 -*-


from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ("base", "0004_auto_20160112_0014"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="word",
            name="alphagram",
        ),
        migrations.RemoveField(
            model_name="word",
            name="lexicon",
        ),
        migrations.AlterField(
            model_name="savedlist",
            name="version",
            field=models.IntegerField(default=2),
        ),
        migrations.DeleteModel(
            name="Word",
        ),
    ]
