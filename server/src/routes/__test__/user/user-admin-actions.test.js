import request from "supertest";
import app from "../../../app.js";
import mongoose from "mongoose";
import User from "../../../model/user/user.mongo.js";

describe("User Admin Actions", () => {
  let adminToken;
  let userToken;
  let userId;

  beforeEach(async () => {
    adminToken = await global.signin(true); // admin
    userToken = await global.signin(); // user
    // Get userId from DB
    const user = await User.findOne({ email: "testuser@example.com" });
    userId = user._id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should update the user's username", async () => {
    const res = await request(app)
      .patch("/v1/users/user")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ username: "updateduser" });
    expect(res.statusCode).toBe(200);
    expect(res.body.username).toBe("updateduser");
  });

  it("should get all users as admin", async () => {
    const res = await request(app)
      .get("/v1/users")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
  });

  it("should get a user by admin", async () => {
    const res = await request(app)
      .get(`/v1/user/${userId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.others).toBeDefined();
    expect(res.body.others.email).toBe("testuser@example.com");
  });
});
