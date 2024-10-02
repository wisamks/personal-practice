FROM node:20.14.0-alpine

WORKDIR /app

COPY . .

RUN npm ci

RUN npm run build

EXPOSE 8080

CMD ["npm", "run", "start:prod"]