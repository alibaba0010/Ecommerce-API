FROM node:18-alpine3.16

# RUN apk update && apk add bash

# SHELL ["/bin/bash", "-o", "pipefail", "-c"]

WORKDIR /usr/src/test

COPY ./ ./

RUN npm install

CMD [ "/bin/sh" ]