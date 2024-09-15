FROM python:3
LABEL maintainer="Cesar Del Solar <delsolar@gmail.com>"

WORKDIR /app

RUN python -m venv .venv && .venv/bin/pip install --no-cache-dir -U pip setuptools
COPY djAerolith/prod_requirements.txt .
RUN .venv/bin/pip install --no-cache-dir -r prod_requirements.txt && find /app/.venv \( -type d -a -name test -o -name tests \) -o \( -type f -a -name '*.pyc' -o -name '*.pyo' \) -exec rm -rf '{}' \+

ENV PATH="/app/.venv/bin:$PATH"

ENV PYTHONUNBUFFERED 1

RUN pip install ddtrace

EXPOSE 8000
# Run command in exec form because /bin/sh does not pass signals to its children.
CMD ["ddtrace-run", "gunicorn", "djaerolith.wsgi:application", "--config", "gunicorn.py"]