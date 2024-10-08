# Generated by Django 2.0.9 on 2019-01-25 03:02

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0002_remove_aerolithprofile_wordwallsmedals"),
    ]

    operations = [
        migrations.AlterField(
            model_name="aerolithprofile",
            name="additional_data",
            field=models.TextField(blank=True, default="{}"),
        ),
        migrations.AlterField(
            model_name="aerolithprofile",
            name="membershipType",
            field=models.IntegerField(
                choices=[(0, "None"), (1, "Bronze"), (2, "Silver"), (3, "Gold")],
                default=0,
            ),
        ),
    ]
