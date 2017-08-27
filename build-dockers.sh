docker build -t domino14/webolith:$CIRCLE_BUILD_NUM -t domino14/webolith:latest .
cd $REPO/kubernetes && docker build -t domino14/webolith-nginx:$CIRCLE_BUILD_NUM -f nginx-Dockerfile --build-arg static_root=./webolith_static/ .
docker login --email $DOCKER_EMAIL --password $DOCKER_PASSWORD --username domino14
docker push domino14/webolith-nginx:$CIRCLE_BUILD_NUM
# Delete the static files.
rm -rf $STATIC_ROOT
docker push domino14/webolith:$CIRCLE_BUILD_NUM
docker push domino14/webolith:latest
