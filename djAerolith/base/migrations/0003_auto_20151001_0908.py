# -*- coding: utf-8 -*-


from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0002_auto_20150914_2227'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='savedlist',
            unique_together=set([('lexicon', 'name', 'user')]),
        ),
    ]
