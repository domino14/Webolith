#!/bin/bash
# Scripts that run during deployment.
echo "Collecting static files..."
djAerolith/manage.py collectstatic --noinput
echo "Executing database migrations..."
djAerolith/manage.py migrate
echo "Compiling messages..."
djAerolith/manage.py compilemessages
