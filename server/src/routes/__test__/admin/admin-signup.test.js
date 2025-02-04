import app from "../../../app.js";
import request from "supertest";

// *******SIGN UP AS ADMIN *****
it("returns a 201 on successful register", async () => {
  return request(app)
    .post("/v1/admin/register")
    .send({
      username: "test",
      email: "test@test.com",
      password: "password",
      confirmPassword: "password",
    })
    .expect(201);
});

// // GET ERRORS FOR INVLID PARAMS
it("returns a 400 with an invalid username", async () => {
  return request(app)
    .post("/v1/admin/register")
    .send({
      username: "", //put invlid name
      email: "test@test.com",
      password: "password",
      confirmPassword: "password",
    })
    .expect(400);
});
it("returns a 400 with an invalid email", async () => {
  return request(app)
    .post("/v1/admin/register")
    .send({
      username: "test",
      email: "alskdflaskjfd",
      password: "password",
      confirmPassword: "password",
    })
    .expect(400);
});
it("returns a 400 with an invalid password", async () => {
  return request(app)
    .post("/v1/admin/register")
    .send({
      username: "test",
      email: "alskdflaskjfd",
      email: "test@test.com",
      password: "p",
      confirmPassword: "password",
    })
    .expect(400);
});

it("returns a 400 with an unable to confirm password", async () => {
  return request(app)
    .post("/v1/admin/register")
    .send({
      username: "test",
      email: "alskdflaskjfd",
      email: "test@test.com",
      password: "password",
      confirmPassword: "passWord",
    })
    .expect(400);
});

// ******MISSING VALUE
it("returns a 400 with missing username, email, password or password", async () => {
  await request(app)
    .post("/v1/admin/register")
    .send({
      email: "test@test.com",
      password: "alskjdf",
      confirmPassword: "alskjdf",
    })
    .expect(400);
  await request(app)
    .post("/v1/admin/register")
    .send({
      username: "test",
      password: "alskjdf",
      confirmPassword: "alskjdf",
    })
    .expect(400);
  await request(app)
    .post("/v1/admin/register")
    .send({
      username: "test",
      email: "test@test.com",
      confirmPassword: "alskjdf",
    })
    .expect(400);
  await request(app)
    .post("/v1/admin/register")
    .send({
      username: "test",
      email: "test@test.com",
      password: "alskjdf",
    })
    .expect(400);
});

// *******DUPLICATE EMAIL AND USERNAME ERROR *****
it("returns a 400 for registering with an exixting username", async () => {
  await request(app)
    .post("/v1/admin/register")
    .send({
      username: "test0",
      email: "test0@test.com",
      password: "password",
      confirmPassword: "password",
    })
    .expect(201);
  await request(app)
    .post("/v1/admin/register")
    .send({
      username: "test0",
      email: "test00@test.com",
      password: "password",
      confirmPassword: "password",
    })
    .expect(400);
});
it("returns a 400 for registering with an exixting email", async () => {
  await request(app)
    .post("/v1/admin/register")
    .send({
      username: "test0",
      email: "test0@test.com",
      password: "password",
      confirmPassword: "password",
    })
    .expect(201);
  await request(app)
    .post("/v1/admin/register")
    .send({
      username: "test00",
      email: "test0@test.com",
      password: "password",
      confirmPassword: "password",
    })
    .expect(400);
});
