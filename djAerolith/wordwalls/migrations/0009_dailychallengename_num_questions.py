# -*- coding: utf-8 -*-


from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("wordwalls", "0008_auto_20160126_2057"),
    ]

    operations = [
        migrations.AddField(
            model_name="dailychallengename",
            name="num_questions",
            field=models.IntegerField(default=50),
        ),
    ]
