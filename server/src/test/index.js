import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import  app  from "../app.js";
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

global.signin = async () => {
  const email = "test@test.com";
  const password = "password";

  const response = await request(app)
    .post("/v1/users/login")
    .send({
      email,
      password,
    })
    .expect(201);

  const cookie = response.get("Set-Cookie");

  return cookie;
};
