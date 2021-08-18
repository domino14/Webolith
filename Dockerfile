FROM domino14/webolith-base-pkg:py3-latest

COPY . /opt/webolith/
WORKDIR /opt/webolith/djAerolith

EXPOSE 8000
# Run command in exec form because /bin/sh does not pass signals to its children.
CMD ["gunicorn", "djaerolith.wsgi:application", "--config", "gunicorn.py"]