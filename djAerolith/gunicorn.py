# Used for docker container
bind = "0.0.0.0:8000"
workers = 3
pidfile = "/gunicorn.pid"
logfile = "/opt/logs/gunicorn.log"
worker_class = "sync"
timeout = 30
daemon = False
