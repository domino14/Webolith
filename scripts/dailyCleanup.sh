#!/bin/bash
cd /home/ubuntu/.virtualenvs/aeroenv && source bin/activate && cd /home/ubuntu/Webolith/djAerolith
python manage.py deleteUnregisteredUsers delete
python manage.py cleanTablegame 2
python manage.py backup -e base_word -e base_alphagram -c --email delsolar@gmail.com
python manage.py awardChallengeMedals