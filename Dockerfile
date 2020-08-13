FROM node:12-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm install -g pm2
CMD pm2-runtime app.js --name stylish