FROM node:lts

WORKDIR /app

# COPY package*.json ./
COPY entrypointFrontend.sh /entrypointFrontend.sh

# RUN npm install
RUN chmod +x /entrypointFrontend.sh

# COPY . .

EXPOSE 3000

ENTRYPOINT [ "/entrypointFrontend.sh" ]
CMD ["npm", "start"]
