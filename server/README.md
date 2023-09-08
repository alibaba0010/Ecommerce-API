## Getting Started

1. Ensure you have Node.js installed.
2. Create a free [Mongo Atlas](https://www.mongodb.com/atlas/database) database online or start a local MongoDB database.
3. Create a `server/.env` file with the properties specified in config.js file in services directory and add to the ".env" file.

```sh
In the terminal,
cd server

# Install dependencies
npm install

## Running the Project
1. In the terminal, run:

npm run dev (nodemon)

## Routes

# Routes and functionality
# Go to "http://localhost:2000" to see all the functionality of this ECOMMERCE-API

## Docker
1. Ensure you have the latest version of Docker with Docker-compose installed
3. Run docker compose up --build in the server folder
```



NODE_OPTIONS=--experimental-vm-modules npm run test
Instance failed to start because a library is missing or cannot be opened: "libcrypto.so.1.1"