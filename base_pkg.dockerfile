# Base image that we can base the prod image on.

FROM python:3-alpine AS builder
LABEL maintainer="Cesar Del Solar <delsolar@gmail.com>"

WORKDIR /app

RUN apk add --no-cache --update gettext postgresql-dev postgresql gcc musl-dev \
    libffi-dev make python3-dev jpeg-dev zlib-dev cargo

RUN python -m venv .venv && .venv/bin/pip install --no-cache-dir -U pip setuptools
COPY djAerolith/prod_requirements.txt .
RUN .venv/bin/pip install --no-cache-dir -r prod_requirements.txt && find /app/.venv \( -type d -a -name test -o -name tests \) -o \( -type f -a -name '*.pyc' -o -name '*.pyo' \) -exec rm -rf '{}' \+


# Stage 2 - Copy only necessary files to the runner stage
FROM python:3-alpine
WORKDIR /app

COPY --from=builder /app /app
ENV PATH="/app/.venv/bin:$PATH"

# postgresql-dev -- needed for psycopg2
RUN apk add --no-cache --update gettext postgresql-dev


ENV PYTHONUNBUFFERED 1


# Prod image can import this image, and build on top of it.
# build like this:
# docker build --no-cache --pull -t domino14/webolith-base-pkg:py3-latest -f base_pkg.dockerfile .
