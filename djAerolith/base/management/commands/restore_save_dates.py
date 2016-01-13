import gzip
import os
import yaml
import datetime

from django.core.management.base import BaseCommand
from django.conf import settings

from base.models import WordList

# Approx. 11:30 AM on 1/11/2016
MIGRATION_DT = datetime.datetime(2016, 1, 11, 23, 30, 0)
# 12:20 AM on 1/12/2016
MIGRATION_DONE_DT = datetime.datetime(2016, 1, 12, 0, 20, 0)


class Command(BaseCommand):
    def handle(self, *args, **options):

        path = os.path.join(settings.PROJECT_ROOT, 'base', 'management',
                            'commands', 'the_dump.yaml.gz')
        with gzip.open(path, 'rb') as f:
            contents = f.read()
        list_info = yaml.load(contents)
        # Create map for fast lookup
        list_map = {}
        for l in list_info:
            list_map['%s' % l['pk']] = l
        print 'Loaded all word list info from yaml'
        word_lists = WordList.objects.filter(is_temporary=False)
        WordList._meta.get_field_by_name('lastSaved')[0].auto_now = False
        for word_list in word_lists:
            last_saved = word_list.lastSaved
            if last_saved > MIGRATION_DT and last_saved < MIGRATION_DONE_DT:
                # This time needs to be restored.
                try:
                    info = list_map['%s' % word_list.pk]
                except KeyError:
                    continue
                word_list.lastSaved = info['fields']['lastSaved']
                word_list.save()
                # print 'Restoring list %s from %s to %s' % (
                #    word_list.pk, last_saved, info['fields']['lastSaved'])
            else:
                print 'List %s not restored (%s, %s)' % (
                    word_list.pk, last_saved, info['fields']['lastSaved'])
        WordList._meta.get_field_by_name('lastSaved')[0].auto_now = True
