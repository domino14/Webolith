# -*- coding: utf-8 -*-


from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ("wordwalls", "0003_auto_20150919_1648"),
    ]

    operations = [
        migrations.AddField(
            model_name="dailychallengemissedbingos",
            name="alphagram_string",
            field=models.CharField(default=b"", max_length=15),
        ),
        migrations.AlterField(
            model_name="dailychallengemissedbingos",
            name="alphagram",
            field=models.ForeignKey(
                to="base.Alphagram", null=True, on_delete=models.CASCADE
            ),
        ),
        migrations.AlterUniqueTogether(
            name="dailychallengemissedbingos",
            unique_together=set([]),
        ),
    ]
