set -e

echo "Building image..."
# docker build --rm -t webolith:dev .
docker-compose up -d
docker-compose run --rm app \
    mysql -h db -ppass -e "drop database if exists djaerolith;" \
    -e "create database djaerolith;" \
    -e "create user aerolith@'%' identified by 'password';" \
    -e "grant all on djaerolith.* to aerolith@'%';"
docker-compose run --rm app python manage.py migrate
docker-compose stop
echo "Finished! You can now run docker-compose up -d to bring up the env."
