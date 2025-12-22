FROM node:22-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
# Não compilar TypeScript aqui - será feito em runtime com ts-node-dev
CMD ["npm", "run", "dev"] 