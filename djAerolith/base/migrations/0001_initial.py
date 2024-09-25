# -*- coding: utf-8 -*-


from django.db import models, migrations
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Alphagram",
            fields=[
                ("alphagram", models.CharField(max_length=15, db_index=True)),
                ("probability", models.IntegerField()),
                (
                    "probability_pk",
                    models.IntegerField(serialize=False, primary_key=True),
                ),
                ("length", models.IntegerField()),
            ],
        ),
        migrations.CreateModel(
            name="Lexicon",
            fields=[
                (
                    "id",
                    models.AutoField(
                        verbose_name="ID",
                        serialize=False,
                        auto_created=True,
                        primary_key=True,
                    ),
                ),
                ("lexiconName", models.CharField(max_length=12)),
                ("lexiconDescription", models.CharField(max_length=64)),
                ("lengthCounts", models.CharField(max_length=256)),
            ],
        ),
        migrations.CreateModel(
            name="SavedList",
            fields=[
                (
                    "id",
                    models.AutoField(
                        verbose_name="ID",
                        serialize=False,
                        auto_created=True,
                        primary_key=True,
                    ),
                ),
                ("created", models.DateTimeField(auto_now_add=True)),
                ("lastSaved", models.DateTimeField(auto_now=True)),
                ("name", models.CharField(max_length=50)),
                ("numAlphagrams", models.IntegerField()),
                ("numCurAlphagrams", models.IntegerField()),
                ("numFirstMissed", models.IntegerField()),
                ("numMissed", models.IntegerField()),
                ("goneThruOnce", models.BooleanField()),
                ("questionIndex", models.IntegerField()),
                ("origQuestions", models.TextField()),
                ("curQuestions", models.TextField()),
                ("missed", models.TextField()),
                ("firstMissed", models.TextField()),
                (
                    "lexicon",
                    models.ForeignKey(to="base.Lexicon", on_delete=models.CASCADE),
                ),
                (
                    "user",
                    models.ForeignKey(
                        to=settings.AUTH_USER_MODEL, on_delete=models.CASCADE
                    ),
                ),
            ],
            options={
                "db_table": "wordwalls_savedlist",
            },
        ),
        migrations.CreateModel(
            name="Word",
            fields=[
                (
                    "id",
                    models.AutoField(
                        verbose_name="ID",
                        serialize=False,
                        auto_created=True,
                        primary_key=True,
                    ),
                ),
                ("word", models.CharField(max_length=15, db_index=True)),
                ("lexiconSymbols", models.CharField(max_length=5)),
                ("definition", models.CharField(max_length=512)),
                ("front_hooks", models.CharField(max_length=26)),
                ("back_hooks", models.CharField(max_length=26)),
                ("inner_front_hook", models.BooleanField(default=False)),
                ("inner_back_hook", models.BooleanField(default=False)),
                (
                    "alphagram",
                    models.ForeignKey(to="base.Alphagram", on_delete=models.CASCADE),
                ),
                (
                    "lexicon",
                    models.ForeignKey(to="base.Lexicon", on_delete=models.CASCADE),
                ),
            ],
        ),
        migrations.AddField(
            model_name="alphagram",
            name="lexicon",
            field=models.ForeignKey(to="base.Lexicon", on_delete=models.CASCADE),
        ),
        migrations.AlterUniqueTogether(
            name="alphagram",
            unique_together=set(
                [("probability", "length", "lexicon"), ("alphagram", "lexicon")]
            ),
        ),
    ]
