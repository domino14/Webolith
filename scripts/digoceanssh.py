import requests
import json
import subprocess
import os
import sys

key = os.getenv("HOME") + '/.ssh/aerolith.pem'
API_TOKEN = os.getenv('DIGITAL_OCEAN_API_TOKEN')


def get_servers():
    resp = requests.get(
        'https://api.digitalocean.com/v2/droplets',
        headers={'Authorization': 'Bearer %s' % API_TOKEN})
    return json.loads(resp.text)['droplets']


def ssh_server(server, servers):
    server_found = False
    for s in servers:
        if server in s['name'].lower():
            ip = s['networks']['v4'][0]['ip_address']
            print "************"
            print "connecting to: " + s['name'], ip
            print "************"
            subprocess.call(["ssh", "-i", key, 'ubuntu@' + ip])
            server_found = True
            break
    if not server_found:
        # try sshing to it as an IP
        subprocess.call(["ssh", "-i", key, 'ubuntu@' + server])

if __name__ == '__main__':
    servers = get_servers()
    if len(sys.argv) != 2:
        print 'Need to provide an argument: the name or IP of the box'
        print '*' * 20
        for server in servers:
            print(server['name'], server['networks']['v4'][0]['ip_address'])

        print '*' * 20
    else:
        server = sys.argv[1].lower()
        ssh_server(server, servers)
