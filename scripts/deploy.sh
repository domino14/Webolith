#!/bin/bash
# Scripts that run during deployment.

echo "Collecting static files..."
python manage.py collectstatic --noinput
echo "Executing database migrations..."
python manage.py migrate
echo "Compiling messages..."
python manage.py compilemessages
echo "Killing gunicorn"
kill -HUP `cat /gunicorn.pid`