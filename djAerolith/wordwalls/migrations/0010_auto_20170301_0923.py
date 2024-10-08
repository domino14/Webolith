# -*- coding: utf-8 -*-


from django.db import migrations, models
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("wordwalls", "0009_dailychallengename_num_questions"),
    ]

    operations = [
        migrations.CreateModel(
            name="Medal",
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
                (
                    "medal_type",
                    models.CharField(
                        max_length=2,
                        choices=[
                            (b"B", b"Bronze"),
                            (b"S", b"Silver"),
                            (b"G", b"Gold"),
                            (b"PS", b"Platinum"),
                            (b"GS", b"GoldStar"),
                        ],
                    ),
                ),
                (
                    "leaderboard",
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
        migrations.AlterUniqueTogether(
            name="medal",
            unique_together=set([("user", "leaderboard")]),
        ),
    ]
