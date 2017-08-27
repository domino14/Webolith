from channels.routing import include
from wordwalls.routing import socket_routing

routing = [
    include(socket_routing, path=r'^/wordwalls-socket'),
]
