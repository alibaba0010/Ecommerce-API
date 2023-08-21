import app from "../../app.js";
import request from "supertest";i
t("returns a 400 with an invalid username", async () => {
  return request(app)
    .post("/v1/users/register")
    .post("/v1/admin/register")
    .send({
      username: "test", //put invlid name
      email: "test@test.com",
      password: "password",
      confirmPassword: "password",
    })
    .expect(400);
});