# A non-management version of the backup.py script. This is meant
# to run in the database server itself, in a crontab.
import time
import os

from boto.s3.connection import S3Connection
from boto.s3.key import Key


def _time_suffix():
    return time.strftime('%Y%m%d-%H%M%S')


def backup():
    backup_dir = 'backups'
    if not os.path.exists(backup_dir):
        os.makedirs(backup_dir)

    outfile = os.path.join(backup_dir, 'backup_%s.sql' % _time_suffix())
    do_postgresql_backup(outfile)

    compressed_outfile = outfile + '.gz'
    do_compress(outfile, compressed_outfile)
    outfile = compressed_outfile
    upload_to_s3(outfile)
    os.remove(outfile)


def compress_dir(directory, outfile):
    os.system('tar -czf %s %s' % (outfile, directory))


def upload_to_s3(filename, bucket='aerolith-backups'):
    conn = S3Connection(os.getenv('AWS_ACCESS_KEY_ID'),
                        os.getenv('AWS_SECRET_ACCESS_KEY'))
    s3_bucket = conn.get_bucket(bucket, validate=False)
    k = Key(s3_bucket)
    k.key = filename
    k.set_contents_from_filename(filename)


def do_compress(infile, outfile):
    os.system('gzip -c %s > %s' % (infile, outfile))
    os.system('rm %s' % infile)


def do_postgresql_backup(outfile):
    db_name = 'djaerolith'
    user = 'aerolith'
    password = os.getenv('DB_PASSWORD')
    host = '127.0.0.1'
    port = '5432'
    args = []
    args += ["--dbname=postgresql://{0}:{1}@{2}:{3}/{4}".format(
        user, password, host, port, db_name)]

    os.system('pg_dump %s > %s' % (' '.join(args), outfile))


if __name__ == '__main__':
    backup()
