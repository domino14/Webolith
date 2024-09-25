# -*- coding: utf-8 -*-


from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ("base", "0005_auto_20160112_2329"),
        ("flashcards", "0001_initial"),
        ("flashcards", "0002_auto_20150914_1924"),
        ("wordwalls", "0001_initial"),
        ("wordwalls", "0002_wordwallsgamemodel_word_list"),
        ("wordwalls", "0003_auto_20150919_1648"),
        ("wordwalls", "0004_auto_20151016_1822"),
        ("wordwalls", "0005_auto_20160112_0014"),
        ("wordwalls", "0006_auto_20160112_2330"),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name="alphagram",
            unique_together=set([]),
        ),
        migrations.RemoveField(
            model_name="alphagram",
            name="lexicon",
        ),
        migrations.DeleteModel(
            name="Alphagram",
        ),
    ]
