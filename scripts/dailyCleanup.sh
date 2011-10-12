#!/bin/bash
cd /home/ubuntu/.virtualenvs/aeroenv && source bin/activate && cd /home/ubuntu/webolith/djAerolith
python manage.py deleteUnregisteredUsers delete
python manage.py cleanTablegame 2
python manage.py backup -e base_word -e base_alphagram -c --email delsolar@gmail.com