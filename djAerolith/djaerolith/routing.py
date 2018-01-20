from channels.routing import include
from wordwalls.routing import socket_routing

routes = [
    include(socket_routing, path=r'^/wordwalls-socket'),
]
