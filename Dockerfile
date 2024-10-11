FROM python:3.12
# Before we update to python3.13 we need to update to psycopg3 (or just plain psycopg)
LABEL maintainer="Cesar Del Solar <delsolar@gmail.com>"

COPY . /opt/webolith/
WORKDIR /app

RUN python -m venv .venv && .venv/bin/pip install --no-cache-dir -U pip setuptools
COPY djAerolith/prod_requirements.txt .
RUN .venv/bin/pip install --no-cache-dir -r prod_requirements.txt && find /app/.venv \( -type d -a -name test -o -name tests \) -o \( -type f -a -name '*.pyc' -o -name '*.pyo' \) -exec rm -rf '{}' \+

ENV PATH="/app/.venv/bin:$PATH"

ENV PYTHONUNBUFFERED 1
WORKDIR /opt/webolith/djAerolith

EXPOSE 8000
# Run command in exec form because /bin/sh does not pass signals to its children.
CMD ["gunicorn", "djaerolith.wsgi:application", "--config", "gunicorn.py"]