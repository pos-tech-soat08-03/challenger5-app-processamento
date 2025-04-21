FROM node:20.19.0-alpine3.21

WORKDIR /app

COPY package*.json ./

RUN npm install --ignore-scripts

COPY src ./src

COPY tsconfig.json ./

RUN npm run build

EXPOSE 3000

CMD ["node", "/app/dist/app.js"]
