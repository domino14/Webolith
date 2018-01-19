FROM node:alpine
ENV NODE_PATH="/usr/lib/node_modules"

COPY . /opt/webolith/
WORKDIR /opt/webolith/

EXPOSE 7000

CMD ["yarn", "dev:wds"]
