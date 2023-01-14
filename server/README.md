version: '3.9'

services:
main:
build:
context: .
target: development
ports: - ${PORT}:${PORT}
volumes: - ./src:/usr/src/app/src - /app/node_modules
env_file: - .env
command: npm run start:dev
depends_on: - mongo - redis
mongo:
image: mongo:5.0.2-focal
volumes: - mongo-data:/data/db
mongo-express:
image: mongo-express:0.54.0
ports: - 8081:8081
depends_on: - mongo
redis:
image: redis:6.2.5-alpine

volumes:
mongo-data:

console.log(typeof this.\_id);
