import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import app from "../app.js";
// import { Types, connect, connection } from "mongoose";
import mongoose from "mongoose";
// declare global {
//   namespace NodeJS {
//     interface Global {
//       signin(): Promise<string[]>; //aditional property
//     }
//   }
// }
let mongo;
beforeAll(async () => {
  process.env.JWT_SECRET = "asdfasdf";
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  mongo = await MongoMemoryServer.create();

  await mongoose.connect(mongo.getUri(), { dbName: "test-db" });
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

global.signin = async (isAdmin = false) => {
  const email = isAdmin ? "admin@example.com" : "testuser@example.com";
  const password = "password123";
  const username = isAdmin ? "adminuser" : "testuser";
  // Register user (or admin)
  await request(app)
    .post(isAdmin ? "/v1/admin/register" : "/v1/users/register")
    .send({
      username,
      email,
      password,
      confirmPassword: password,
    });
  // Login user
  const response = await request(app).post("/v1/users/login").send({
    value: email,
    password,
  });
  // Extract JWT from session if available
  // If your login response includes the JWT in the body, return it
  // Otherwise, parse from cookie/session as needed
  // Here, assuming JWT is in response.body.token or response.body.jwt
  return response.body.token || response.body.jwt;
};
