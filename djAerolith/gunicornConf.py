import multiprocessing

bind = "0.0.0.0:8000"
#workers = multiprocessing.cpu_count() * 2 + 1
workers = 3
pidfile = "/gunicorn.pid"
logfile = "/var/log/gunicorn.log"
worker_class = "sync"
timeout = 30
#daemon = True
#loglevel = "debug"
