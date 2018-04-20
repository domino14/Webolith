# XXX: This module is not in use, along with Django Channels.
# If we ever bring back sockets, either figure out how to use
# channels 2.0 and load test it heavily, or just use Firebase.
from channels.routing import include
from wordwalls.routing import socket_routing

routes = [
    include(socket_routing, path=r'^/wordwalls-socket'),
]
