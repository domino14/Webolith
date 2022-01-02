FROM node:alpine

WORKDIR /opt/webolith/

ENV PATH /opt/webolith/node_modules/.bin:$PATH

COPY ./package.json ./
COPY ./package-lock.json ./

EXPOSE 7000

RUN ["npm", "ci"]

CMD ["npm", "run", "dev:wds"]