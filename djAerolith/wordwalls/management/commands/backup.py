import os
import popen2
import time
from optparse import make_option
import logging

from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from boto.s3.connection import S3Connection
from boto.s3.key import Key

logger = logging.getLogger(__name__)

# example: python manage.py backup -e base_word -e base_alphagram -c

# Based on: http://www.djangosnippets.org/snippets/823/
# Based on: http://www.yashh.com/blog/2008/sep/05/django-database-backup-view/


class Command(BaseCommand):
    option_list = BaseCommand.option_list + (
        make_option('--email', default=None, dest='email',
                    help='Sends email with attached dump file'),
        make_option('--compress', '-c', action='store_true', default=False,
                    dest='compress',
                    help='Compress dump file'),
        make_option('--directory', '-d', action='append', default=[],
                    dest='directories',
                    help='Compress dump file'),
        make_option('--exclude-tables', '-e', action='append', default=[],
                    dest='excludeTables',
                    help='Exclude tables')
    )
    help = "Backup database. Only Mysql and Postgresql engines are implemented"

    def _time_suffix(self):
        return time.strftime('%Y%m%d-%H%M%S')

    def handle(self, *args, **options):
        self.compress = options.get('compress')
        self.directories = options.get('directories')
        self.excludeTables = options.get('excludeTables')

        self.engine = settings.DATABASES['default']['ENGINE']
        self.db = settings.DATABASES['default']['NAME']
        self.user = settings.DATABASES['default']['USER']
        self.passwd = settings.DATABASES['default']['PASSWORD']
        self.host = settings.DATABASES['default']['HOST']
        self.port = settings.DATABASES['default']['PORT']

        backup_dir = 'backups'
        if not os.path.exists(backup_dir):
            os.makedirs(backup_dir)

        outfile = os.path.join(backup_dir, 'backup_%s.sql' %
                               self._time_suffix())

        # Doing backup
        if self.engine == 'django.db.backends.mysql':
            logger.debug('Doing Mysql backup to database %s into %s', self.db,
                         outfile)
            self.do_mysql_backup(outfile)
        elif self.engine in ('django.db.backends.postgresql_psycopg2',
                             'django.db.backends.postgresql'):
            logger.debug('Doing Postgresql backup to database %s into %s',
                         self.db, outfile)
            self.do_postgresql_backup(outfile)
        else:
            raise CommandError('Backup in %s engine not implemented' %
                               self.engine)

        # Compressing backup
        if self.compress:
            compressed_outfile = outfile + '.gz'
            logger.debug('Compressing backup file %s to %s', outfile,
                         compressed_outfile)
            self.do_compress(outfile, compressed_outfile)
            outfile = compressed_outfile

        self.upload_to_s3(outfile)

    def compress_dir(self, directory, outfile):
        os.system('tar -czf %s %s' % (outfile, directory))

    def upload_to_s3(self, filename, bucket='aerolith-backups'):
        conn = S3Connection(settings.AWS_ACCESS_KEY_ID,
                            settings.AWS_SECRET_ACCESS_KEY)
        if settings.BACKUP_BUCKET_SUFFIX:
            bucket = bucket + settings.BACKUP_BUCKET_SUFFIX
        s3_bucket = conn.get_bucket(bucket, validate=False)
        k = Key(s3_bucket)
        k.key = filename
        k.set_contents_from_filename(filename)

    def do_compress(self, infile, outfile):
        os.system('gzip --stdout %s > %s' % (infile, outfile))
        os.system('rm %s' % infile)

    def do_mysql_backup(self, outfile):
        args = []
        if self.user:
            args += ["--user=%s" % self.user]
        if self.passwd:
            args += ["--password=%s" % self.passwd]
        if self.host:
            args += ["--host=%s" % self.host]
        if self.port:
            args += ["--port=%s" % self.port]

        if len(self.excludeTables) > 0:
            for table in self.excludeTables:
                args += ["--ignore-table=%s" % (self.db + '.' + table)]

        args += [self.db]

        os.system('mysqldump %s > %s' % (' '.join(args), outfile))

    def do_postgresql_backup(self, outfile):
        args = []
        if self.user:
            args += ["--username=%s" % self.user]
        if self.passwd:
            args += ["--password"]
        if self.host:
            args += ["--host=%s" % self.host]
        if self.port:
            args += ["--port=%s" % self.port]
        if self.db:
            args += [self.db]
        pipe = popen2.Popen4('pg_dump %s > %s' % (' '.join(args), outfile))
        if self.passwd:
            pipe.tochild.write('%s\n' % self.passwd)
            pipe.tochild.close()

# mysqldump -u dave -ppassword -h localhost
# --ignore-table=my_db_name.my_table_name my_db_name

# use --ignore-table multiple times
