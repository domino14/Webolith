FROM ubuntu:16.04
MAINTAINER Cesar Del Solar <delsolar@gmail.com>

ENV PYTHONUNBUFFERED 1

RUN apt-get update && apt-get install -y python python-pip \
    python-dev gettext libpq-dev postgresql-client-9.5
COPY . /opt/webolith/
RUN pip install -r /opt/webolith/djAerolith/requirements.txt
WORKDIR /opt/webolith/