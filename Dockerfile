FROM domino14/webolith-base-pkg
MAINTAINER Cesar Del Solar <delsolar@gmail.com>

COPY . /opt/webolith/
WORKDIR /opt/webolith/djAerolith

EXPOSE 8000
# Run command in exec form because /bin/sh does not pass signals to its children.
CMD ["daphne", "-b", "0.0.0.0", "djaerolith.asgi:channel_layer"]