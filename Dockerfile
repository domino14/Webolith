FROM ubuntu:14.04
MAINTAINER Cesar Del Solar <delsolar@gmail.com>

ENV PYTHONUNBUFFERED 1
RUN apt-get update && apt-get install -y python python-pip \
    python-dev libmysqlclient-dev mysql-client gettext
COPY . /opt/webolith/
RUN pip install -r /opt/webolith/djAerolith/requirements.txt
WORKDIR /opt/webolith/