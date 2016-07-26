template = """# Generated on {{dt}}
*filter
:INPUT DROP
:FORWARD ACCEPT
:OUTPUT ACCEPT
-A INPUT -i lo -j ACCEPT
-A INPUT -p tcp -m tcp --dport 22 -j ACCEPT
-A INPUT -i eth0 -m state --state RELATED,ESTABLISHED -j ACCEPT
-A INPUT -i eth1 -m state --state RELATED,ESTABLISHED -j ACCEPT
-A INPUT -p icmp -j ACCEPT
{{#rule}}{{#tcprule}}
-A INPUT -s {{source}}/32 -p tcp -m tcp --dport {{dport}} -m state --state NEW,ESTABLISHED -j ACCEPT
{{/tcprule}}{{#allrule}}
-A INPUT -p {{protocol}} -m {{protocol}} --dport {{dport}} -j ACCEPT
{{/allrule}}{{/rule}}
COMMIT
"""
import pystache
import datetime


# securityGroups are a hash of "security groups" and a list of boxes in each
# group
securityGroups = {'Database': ['aerolith-pg'],
                  'Web': ['aerolith-web'],
                  'Wordpress': ['AerolithWP'],
                  'Dev': ['ubuntu-512mb-sfo1-01']
                  }

# groupRules tell you for each security groups, which security groups
# can connect to it and what ports
# note all of these have port 22 (ssh) open by default (see template above)
groupRules = {'Web': [('all', 80), ('all', 443), ('all', 21), ('all', 20),
                      ('all', '61052:61057'), ('all', 8080)],
              'Redis': [('Web', 6379), ('all', 80)],
              'Database': [('Web', 5432)],
              'Dev': [('all', 80), ('all', 443)]
              }


def gen_firewall(securityGroup, servers):
    context = {'rule': {'tcprule': [], 'allrule': []},
               'dt': str(datetime.datetime.now())}

    rule = groupRules[securityGroup]

    for subrule in rule:
        if subrule[0] == 'all':
            port = subrule[1]
            context['rule']['allrule'].append({'dport': port,
                                               'protocol': 'tcp'})
        else:
            for server in servers:
                # for each server in the security group in question
                # add its private ip to the firewall
                if server['name'] in securityGroups[subrule[0]]:
                    port = subrule[1]
                    context['rule']['tcprule'].append(
                        {'source': server['networks']['v4'][0]['ip_address'],
                         'dport': port
                         })

    res = pystache.render(template, context)

    f = open('iptables.' + securityGroup + '.rules', 'wb')
    f.write(res)
    f.close()

    return res
