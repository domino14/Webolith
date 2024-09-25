# -*- coding: utf-8 -*-


from django.db import models, migrations
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ("base", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="DailyChallenge",
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
                ("date", models.DateField()),
                ("alphagrams", models.TextField()),
                ("seconds", models.IntegerField()),
                (
                    "lexicon",
                    models.ForeignKey(to="base.Lexicon", on_delete=models.CASCADE),
                ),
            ],
        ),
        migrations.CreateModel(
            name="DailyChallengeLeaderboard",
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
                ("maxScore", models.IntegerField()),
                ("medalsAwarded", models.BooleanField(default=False)),
                (
                    "challenge",
                    models.OneToOneField(
                        to="wordwalls.DailyChallenge", on_delete=models.CASCADE
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="DailyChallengeLeaderboardEntry",
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
                ("score", models.IntegerField()),
                ("timeRemaining", models.IntegerField()),
                ("qualifyForAward", models.BooleanField(default=True)),
                ("additionalData", models.TextField(null=True)),
                (
                    "board",
                    models.ForeignKey(
                        to="wordwalls.DailyChallengeLeaderboard",
                        on_delete=models.CASCADE,
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        to=settings.AUTH_USER_MODEL, on_delete=models.CASCADE
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="DailyChallengeMissedBingos",
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
                ("numTimesMissed", models.IntegerField(default=0)),
                (
                    "alphagram",
                    models.ForeignKey(to="base.Alphagram", on_delete=models.CASCADE),
                ),
                (
                    "challenge",
                    models.ForeignKey(
                        to="wordwalls.DailyChallenge", on_delete=models.CASCADE
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="DailyChallengeName",
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
                ("name", models.CharField(max_length=32)),
                ("timeSecs", models.IntegerField(default=0)),
                ("orderPriority", models.IntegerField(default=1)),
            ],
            options={
                "ordering": ["orderPriority", "id"],
            },
        ),
        migrations.CreateModel(
            name="NamedList",
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
                ("name", models.CharField(default=b"", max_length=50)),
                ("numQuestions", models.IntegerField()),
                ("wordLength", models.IntegerField()),
                ("isRange", models.BooleanField()),
                ("questions", models.TextField(default=b"")),
                (
                    "lexicon",
                    models.ForeignKey(to="base.Lexicon", on_delete=models.CASCADE),
                ),
            ],
        ),
        migrations.CreateModel(
            name="WordwallsGameModel",
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
                ("lastActivity", models.DateTimeField(auto_now=True)),
                ("currentGameState", models.TextField()),
                (
                    "gameType",
                    models.IntegerField(choices=[(1, b"WordWalls"), (2, b"WordGrids")]),
                ),
                (
                    "playerType",
                    models.IntegerField(
                        choices=[(1, b"SinglePlayer"), (2, b"MultiPlayer")]
                    ),
                ),
                ("numOrigQuestions", models.IntegerField()),
                ("origQuestions", models.TextField()),
                ("numCurQuestions", models.IntegerField()),
                ("curQuestions", models.TextField()),
                ("numMissed", models.IntegerField()),
                ("missed", models.TextField()),
                ("numFirstMissed", models.IntegerField()),
                ("firstMissed", models.TextField()),
                (
                    "host",
                    models.ForeignKey(
                        related_name="wordwalls_wordwallsgamemodel_host",
                        to=settings.AUTH_USER_MODEL,
                        on_delete=models.CASCADE,
                    ),
                ),
                (
                    "inTable",
                    models.ManyToManyField(
                        related_name="wordwalls_wordwallsgamemodel_inTable",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "lexicon",
                    models.ForeignKey(to="base.Lexicon", on_delete=models.CASCADE),
                ),
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.AddField(
            model_name="dailychallenge",
            name="name",
            field=models.ForeignKey(
                to="wordwalls.DailyChallengeName", on_delete=models.CASCADE
            ),
        ),
        migrations.AlterUniqueTogether(
            name="dailychallengemissedbingos",
            unique_together=set([("challenge", "alphagram")]),
        ),
        migrations.AlterUniqueTogether(
            name="dailychallengeleaderboardentry",
            unique_together=set([("board", "user")]),
        ),
        migrations.AlterUniqueTogether(
            name="dailychallenge",
            unique_together=set([("name", "lexicon", "date")]),
        ),
    ]
