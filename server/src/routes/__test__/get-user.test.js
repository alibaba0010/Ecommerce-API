import app from "../../app.js";
import request from "supertest";
it("returns a 400 with an invalid email", async () => {
  return request(app)
    .post("/v1/users/register")
    .post("/v1/admin/register")
    .send({
      username: "test",
      email: "alskdflaskjfd",
      password: "password",
      confirmPassword: "password",
    })
    .expect(400);
});
