#!/bin/bash
# Scripts that run during deployment.
# If we modify this file we have to rebuild the Dockerfile.
# We should move away from docker-compose for prod, or come up
# with a better strategy.
echo "Collecting static files..."
djAerolith/manage.py collectstatic --noinput
echo "Executing database migrations..."
djAerolith/manage.py migrate
echo "Compiling messages..."
djAerolith/manage.py compilemessages
echo "Killing gunicorn"
kill -HUP `cat /gunicorn.pid`