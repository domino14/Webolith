FROM domino14/webolith-base-pkg:py3-latest

COPY . /opt/webolith/
WORKDIR /opt/webolith/djAerolith

RUN pip install ddtrace

EXPOSE 8000
# Run command in exec form because /bin/sh does not pass signals to its children.
CMD ["ddtrace-run", "gunicorn", "djaerolith.wsgi:application", "--config", "gunicorn.py"]