`cesar@mbp:~/coding/webolith (ops/xxx/docker)$ docker run --rm -it domino14/webolith-django /bin/bash`

Then, in bash:
`# mysql -h 172.17.0.2 -p`   (ip came from inspect on running mysql db)


mysql db was started like:

`docker run --rm -it --volumes-from webolith_db_data_1 mysql:latest`

`webolith_db_data_1` came from  `docker-compose up db_data`


