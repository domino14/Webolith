
FROM node:latest

USER node

WORKDIR /opt/webolith/

ENV PATH /opt/webolith/node_modules/.bin:$PATH

EXPOSE 3000
