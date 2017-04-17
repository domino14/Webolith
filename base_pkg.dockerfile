# Base image that we can base the prod image on.

FROM python:2-alpine
MAINTAINER Cesar Del Solar <delsolar@gmail.com>

ENV PYTHONUNBUFFERED 1

RUN apk add --update gettext postgresql-dev postgresql gcc musl-dev libffi-dev

COPY djAerolith/prod_requirements.txt /opt/prod_requirements.txt
RUN pip install --upgrade pip
RUN pip install -r /opt/prod_requirements.txt

# Prod image can import this image, and build on top of it.