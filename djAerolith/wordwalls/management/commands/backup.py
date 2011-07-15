import os, popen2, time
from datetime import datetime
from optparse import make_option

from django.core.management.base import BaseCommand, CommandError
from django.core.mail import EmailMessage
from django.conf import settings

# Based on: http://www.djangosnippets.org/snippets/823/
# Based on: http://www.yashh.com/blog/2008/sep/05/django-database-backup-view/
class Command(BaseCommand):
    option_list = BaseCommand.option_list + (
        make_option('--email', default=None, dest='email',
            help='Sends email with attached dump file'),
        make_option('--compress', '-c', action='store_true', default=False, dest='compress',
            help='Compress dump file'),
        make_option('--directory', '-d', action='append', default=[], dest='directories',
            help='Compress dump file'),
        make_option('--exclude-tables', '-e', action='append', default=[], dest='excludeTables',
            help='Exclude tables')
    )
    help = "Backup database. Only Mysql and Postgresql engines are implemented"

    def _time_suffix(self):
        return time.strftime('%Y%m%d-%H%M%S')

    def handle(self, *args, **options):
        self.email = options.get('email')
        self.compress = options.get('compress')
        self.directories = options.get('directories')
        self.excludeTables = options.get('excludeTables')

        from django.db import connection

        self.engine = settings.DATABASES['default']['ENGINE']
        self.db = settings.DATABASES['default']['NAME']
        self.user = settings.DATABASES['default']['USER']
        self.passwd = settings.DATABASES['default']['PASSWORD']
        self.host = settings.DATABASES['default']['HOST']
        self.port = settings.DATABASES['default']['PORT']
        
        backup_dir = 'backups'
        if not os.path.exists(backup_dir):
            os.makedirs(backup_dir)

        outfile = os.path.join(backup_dir, 'backup_%s.sql' % self._time_suffix())

        # Doing backup
        if self.engine == 'django.db.backends.mysql':
            print 'Doing Mysql backup to database %s into %s' % (self.db, outfile)
            self.do_mysql_backup(outfile)
        elif self.engine in ('django.db.backends.postgresql_psycopg2', 'django.db.backends.postgresql'):
            print 'Doing Postgresql backup to database %s into %s' % (self.db, outfile)
            self.do_postgresql_backup(outfile)
        else:
            raise CommandError('Backup in %s engine not implemented' % self.engine)

        # Compressing backup
        if self.compress:
            compressed_outfile = outfile + '.gz'
            print 'Compressing backup file %s to %s' % (outfile, compressed_outfile)
            self.do_compress(outfile, compressed_outfile)
            outfile = compressed_outfile

        # Backuping directoris
        dir_outfiles = []
        for directory in self.directories:
            dir_outfile = os.path.join(backup_dir, '%s_%s.tar.gz' % (os.path.basename(directory), self._time_suffix()))
            dir_outfiles.append(dir_outfile)
            print("Compressing '%s' to '%s'" % (directory, dir_outfile))
            self.compress_dir(directory, dir_outfile)

        # Sending mail with backups
        if self.email:
            print "Sending e-mail with backups to '%s'" % self.email
            self.sendmail(settings.SERVER_EMAIL, [self.email], dir_outfiles + [outfile])

    def compress_dir(self, directory, outfile):
        os.system('tar -czf %s %s' % (outfile, directory))

    def sendmail(self, address_from, addresses_to, attachements):
        subject = "Your DB-backup for " + datetime.now().strftime("%d %b %Y")
        body = "Timestamp of the backup is " + datetime.now().strftime("%d %b %Y")

        email = EmailMessage(subject, body, address_from, addresses_to)
        email.content_subtype = 'html'
        for attachement in attachements:
            email.attach_file(attachement)
        email.send()

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

# mysqldump -u dave -ppassword -h localhost --ignore-table=my_db_name.my_table_name my_db_name   use --ignore-table multiple times