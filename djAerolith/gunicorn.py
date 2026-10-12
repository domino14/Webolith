# Used for docker container
bind = "0.0.0.0:8000"
workers = 2
pidfile = "/gunicorn.pid"
worker_class = "sync"
timeout = 30
daemon = False
# Load Django (and, via wsgi.py, the URLconf and every view module) once in the
# master before forking, so each worker starts warm instead of paying ~1.7s on
# its first request -- which during a deploy queued requests for up to 12s.
preload_app = True
