import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { app } from "../app";

let mongo;
beforeAll(async () => {
  process.env.JWT_SECRET = "asdfasdf";
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  mongo = await MongoMemoryServer.create({
    instance: {
      dbName: "test-db", // Your desired database name
      storageEngine: "wiredTiger", // Optional: Specify the storage engine
      port: 27017, // Optional: Specify a custom port number
      // debug: true, // Optional: Set to true to enable debugging output
      // Extend the launch timeout to 10 seconds (10000 milliseconds)
      // Adjust this value as needed for your specific environment
      launchTimeout: 10000,
    },
  }); // Assign the MongoMemoryServer instance to the global mongo variable
  const mongoUri = mongo.getUri(); // Get the URI from the MongoMemoryServer instance
  await mongoose.connect(mongoUri);
});

beforeEach(async () => {
  const collections = await mongoose.connection.db.collections();

  for (let collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongo.stop();
  await mongoose.connection.close();
});

global.signin = async () => {
  const email = "test@test.com";
  const password = "password";

  const response = await request(app)
    .post("/api/v1/users/signup")
    .send({
      email,
      password,
    })
    .expect(201);

  const cookie = response.get("Set-Cookie");

  return cookie;
};
