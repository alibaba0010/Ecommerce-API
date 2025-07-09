import app from "../../../app.js";
import request from "supertest";

describe("User Admin Functionality", () => {
  it("registers a new admin", async () => {
    const res = await request(app)
      .post("/v1/admin/register")
      .send({
        username: "adminuser",
        email: "adminuser@test.com",
        password: "password",
        confirmPassword: "password",
      })
      .expect(201);
    expect(res.body.username).toBe("adminuser");
    expect(res.body.email).toBe("adminuser@test.com");
  });
});
