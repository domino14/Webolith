#!/bin/bash
# run like
# /usr/bin/docker exec webolith_app_1 sh /opt/webolith/scripts/dailyCleanup.sh
cd /opt/webolith/djAerolith
./manage.py cleanTablegame 2
./manage.py backup -c
./manage.py awardChallengeMedals