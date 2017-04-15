""" On startup, we need to do a few things.

- we need a supervisord to docker run our containers: nginx, haproxy, gunicorn,
and macondo. They should run without names. This is separate from this script.

- Then, use the Docker API to get the containers. For example, get the
webolith containers from the image names and their internal IPs

- Modify haproxy file with these new IPs.

"""
import json
import time
import sys

MAX_TRIES = 6
TRY_INTERVAL = 5  # SECS

resp = """
[
  {
    "Id": "a398c2c0483b055244b6dcc4c757c53ef654ba9bf932fb0d40029d54c5439928",
    "Names": [
      "/haproxy"
    ],
    "Image": "my-haproxy",
    "ImageID": "sha256:1f183ae44a61d8371ff9c8eb79a72258f2981d280328010d0c34ddc1663043b4",
    "Command": "/docker-entrypoint.sh haproxy -f /usr/local/etc/haproxy/haproxy.cfg",
    "Created": 1492015697,
    "Ports": [
      {
        "IP": "0.0.0.0",
        "PrivatePort": 9999,
        "PublicPort": 9999,
        "Type": "tcp"
      },
      {
        "IP": "0.0.0.0",
        "PrivatePort": 443,
        "PublicPort": 443,
        "Type": "tcp"
      },
      {
        "IP": "0.0.0.0",
        "PrivatePort": 80,
        "PublicPort": 80,
        "Type": "tcp"
      }
    ],
    "Labels": {},
    "State": "running",
    "Status": "Up 12 hours",
    "HostConfig": {
      "NetworkMode": "aeronet"
    },
    "NetworkSettings": {
      "Networks": {
        "aeronet": {
          "IPAMConfig": null,
          "Links": null,
          "Aliases": null,
          "NetworkID": "1181b59094e2862142bb06ece310276ea5c7d65ec6286a7d43c446404d27e27d",
          "EndpointID": "7466b735392bfc8a088ebc2ee48aae257654f34062290ae98e394719871a0510",
          "Gateway": "192.168.17.1",
          "IPAddress": "192.168.17.5",
          "IPPrefixLen": 24,
          "IPv6Gateway": "",
          "GlobalIPv6Address": "",
          "GlobalIPv6PrefixLen": 0,
          "MacAddress": "02:42:c0:a8:11:05"
        }
      }
    },
    "Mounts": [
      {
        "Type": "bind",
        "Source": "/Users/cesar/coding/webolith/config/private-ssl",
        "Destination": "/etc/ssl/private",
        "Mode": "",
        "RW": true,
        "Propagation": ""
      }
    ]
  },
  {
    "Id": "d018d4a1d4501979fe8262a5e398d2310db5c40500255f19166bbf01b67a5810",
    "Names": [
      "/nginx-static"
    ],
    "Image": "domino14/webolith-nginx:237",
    "ImageID": "sha256:943507182a5fcb86f751274b5c1b151eb506ef1434daa0ccf2df8936afec096b",
    "Command": "nginx -g 'daemon off;'",
    "Created": 1491931767,
    "Ports": [
      {
        "PrivatePort": 443,
        "Type": "tcp"
      },
      {
        "PrivatePort": 80,
        "Type": "tcp"
      }
    ],
    "Labels": {},
    "State": "running",
    "Status": "Up 35 hours",
    "HostConfig": {
      "NetworkMode": "aeronet"
    },
    "NetworkSettings": {
      "Networks": {
        "aeronet": {
          "IPAMConfig": null,
          "Links": null,
          "Aliases": null,
          "NetworkID": "1181b59094e2862142bb06ece310276ea5c7d65ec6286a7d43c446404d27e27d",
          "EndpointID": "b252a68b44d8ca51d058526e30ef23a8ca92a0b0306d7a583bfaf0c64546dff0",
          "Gateway": "192.168.17.1",
          "IPAddress": "192.168.17.4",
          "IPPrefixLen": 24,
          "IPv6Gateway": "",
          "GlobalIPv6Address": "",
          "GlobalIPv6PrefixLen": 0,
          "MacAddress": "02:42:c0:a8:11:04"
        }
      }
    },
    "Mounts": []
  },
  {
    "Id": "872c3b26a4f890117e76045abf299c62acc94a839a36d958bc1fe37f7137442e",
    "Names": [
      "/pgdb"
    ],
    "Image": "postgres:latest",
    "ImageID": "sha256:9910dc9f2ac0dbc193abc4718984cb3ad48989fc02cac4b36ad3d6b7d5d781f9",
    "Command": "docker-entrypoint.sh postgres",
    "Created": 1491929145,
    "Ports": [
      {
        "PrivatePort": 5432,
        "Type": "tcp"
      }
    ],
    "Labels": {},
    "State": "running",
    "Status": "Up 36 hours",
    "HostConfig": {
      "NetworkMode": "aeronet"
    },
    "NetworkSettings": {
      "Networks": {
        "aeronet": {
          "IPAMConfig": null,
          "Links": null,
          "Aliases": null,
          "NetworkID": "1181b59094e2862142bb06ece310276ea5c7d65ec6286a7d43c446404d27e27d",
          "EndpointID": "af57e4e110b4d18e7b30db5a31b831691c92f44009636941c9d4591c1829064f",
          "Gateway": "192.168.17.1",
          "IPAddress": "192.168.17.3",
          "IPPrefixLen": 24,
          "IPv6Gateway": "",
          "GlobalIPv6Address": "",
          "GlobalIPv6PrefixLen": 0,
          "MacAddress": "02:42:c0:a8:11:03"
        }
      }
    },
    "Mounts": [
      {
        "Type": "volume",
        "Name": "eb39c505e167bc74107733499c5d7e3b69b4561f8a988057f32c68ddeb56fd62",
        "Source": "/var/lib/docker/volumes/eb39c505e167bc74107733499c5d7e3b69b4561f8a988057f32c68ddeb56fd62/_data",
        "Destination": "/var/lib/postgresql/data",
        "Driver": "local",
        "Mode": "",
        "RW": true,
        "Propagation": ""
      }
    ]
  },
  {
    "Id": "d02e22585e6cfc40b0624d5444a06e37cbd01fa59641d551df85298e58298c22",
    "Names": [
      "/webolith"
    ],
    "Image": "domino14/webolith:latest",
    "ImageID": "sha256:3e5b9b09b6adaf4d01d9ffc65fc4a1ab259106ed00b3520016423e215747267f",
    "Command": "gunicorn wsgi:application --config gunicorn.py",
    "Created": 1491929090,
    "Ports": [
      {
        "PrivatePort": 8000,
        "Type": "tcp"
      }
    ],
    "Labels": {},
    "State": "running",
    "Status": "Up 36 hours",
    "HostConfig": {
      "NetworkMode": "aeronet"
    },
    "NetworkSettings": {
      "Networks": {
        "aeronet": {
          "IPAMConfig": null,
          "Links": null,
          "Aliases": null,
          "NetworkID": "1181b59094e2862142bb06ece310276ea5c7d65ec6286a7d43c446404d27e27d",
          "EndpointID": "137b694ec550ccd8c95124cb1f3165dca9160ecdeef3f99c742e3d3ca443e404",
          "Gateway": "192.168.17.1",
          "IPAddress": "192.168.17.2",
          "IPPrefixLen": 24,
          "IPv6Gateway": "",
          "GlobalIPv6Address": "",
          "GlobalIPv6PrefixLen": 0,
          "MacAddress": "02:42:c0:a8:11:02"
        }
      }
    },
    "Mounts": []
  }
] """


def get_containers():
    django = []
    nginx = []
    tries = 0
    while len(django) != 2 and len(nginx) != 2:
        if tries > MAX_TRIES:
            print 'Error - exceeded MAX_TRIES'
            sys.exit(1)
        # get call here
        containers = json.loads(resp)
        django = running_containers(containers, 'domino14/webolith:')
        nginx = running_containers(containers, 'domino14/webolith-nginx:')
        print django, len(django)
        print nginx, len(nginx)
        if len(django) == 2 and len(nginx) == 2:
            break
        # Otherwise sleep and try again.
        time.sleep(TRY_INTERVAL)
        tries += 1


def running_containers(containers, container_name):
    """ Gets the container info for containers with given container_name """
    ret = []
    for container in containers:
        if container['Image'].startswith(container_name):
            ret.append(container)

    return ret


if __name__ == '__main__':
    get_containers()
