FROM node:lts

WORKDIR /app

COPY entrypointBackend.sh /entrypointBackend.sh

RUN chmod +x /entrypointBackend.sh

EXPOSE 3001 3002 5555

ENTRYPOINT [ "/entrypointBackend.sh" ]
CMD [ "npm", "run", "start:dev" ]
