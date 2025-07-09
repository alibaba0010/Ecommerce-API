import app from "../../../app.js";
import request from "supertest";

describe("User Password Functionality", () => {
  it("updates user password with correct old password", async () => {
    await request(app)
      .post("/v1/users/register")
      .send({
        username: "pwuser",
        email: "pwuser@test.com",
        password: "password",
        confirmPassword: "password",
      })
      .expect(201);
    const loginRes = await request(app)
      .post("/v1/users/login")
      .send({ value: "pwuser@test.com", password: "password" })
      .expect(200);
    const cookie = loginRes.headers["set-cookie"];
    await request(app)
      .patch("/v1/user/password")
      .set("Cookie", cookie)
      .send({ oldPassword: "password", newPassword: "newpassword" })
      .expect(200);
  });

  it("fails to update password with wrong old password", async () => {
    await request(app)
      .post("/v1/users/register")
      .send({
        username: "pwuser2",
        email: "pwuser2@test.com",
        password: "password",
        confirmPassword: "password",
      })
      .expect(201);
    const loginRes = await request(app)
      .post("/v1/users/login")
      .send({ value: "pwuser2@test.com", password: "password" })
      .expect(200);
    const cookie = loginRes.headers["set-cookie"];
    await request(app)
      .patch("/v1/user/password")
      .set("Cookie", cookie)
      .send({ oldPassword: "wrong", newPassword: "newpassword" })
      .expect(401);
  });
});
