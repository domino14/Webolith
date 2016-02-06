#!/bin/bash
source /home/ubuntu/config.env
cd /home/ubuntu/.virtualenvs/aeroenv && source bin/activate && cd /home/ubuntu/webolith/djAerolith
python manage.py cleanTablegame 2
python manage.py backup -e base_word -e base_alphagram -c
python manage.py awardChallengeMedals