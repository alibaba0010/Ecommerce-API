import app from "../../../app.js";
import request from "supertest";

describe("User Login Functionality", () => {
  it("fails with 400 when a email or username that does not exist is supplied", async () => {
    await request(app)
      .post("/v1/users/login")
      .send({
        value: "test@test.com",
        password: "password",
      })
      .expect(400);

    await request(app)
      .post("/v1/users/login")
      .send({
        value: "test",
        password: "password",
      })
      .expect(400);
  });

  it("fails when an incorrect password is supplied", async () => {
    await global.signin(); // register user
    await request(app)
      .post("/v1/users/login")
      .send({
        value: "testuser@example.com",
        password: "wrongpassword",
      })
      .expect(401);
  });

  it("responds with a token when given valid credentials", async () => {
    await global.signin();
    const response = await request(app)
      .post("/v1/users/login")
      .send({
        value: "testuser@example.com",
        password: "password123",
      })
      .expect(200);
    expect(response.body.id).toBeDefined();
    expect(response.body.username).toBe("testuser");
  });

  it("fails with 400 if required fields are missing", async () => {
    await request(app).post("/v1/users/login").send({ value: "" }).expect(400);
    await request(app)
      .post("/v1/users/login")
      .send({ password: "password" })
      .expect(400);
  });

  it("clears the token after logging out", async () => {
    await global.signin();
    const loginRes = await request(app)
      .post("/v1/users/login")
      .send({
        value: "testuser@example.com",
        password: "password123",
      })
      .expect(200);
    const cookie = loginRes.headers["set-cookie"];
    const response = await request(app)
      .get("/v1/users/logout")
      .set("Cookie", cookie)
      .send({})
      .expect(200);
    expect(response.body.msg).toMatch(/logged out/i);
  });

  it("responds with details about the current user", async () => {
    await global.signin();
    const loginRes = await request(app)
      .post("/v1/users/login")
      .send({
        value: "testuser@example.com",
        password: "password123",
      })
      .expect(200);
    const cookie = loginRes.headers["set-cookie"];
    const response = await request(app)
      .get("/v1/user")
      .set("Cookie", cookie)
      .send()
      .expect(200);
    expect(response.body.email).toBe("testuser@example.com");
  });

  it("responds with 401 if not authenticated for current user", async () => {
    await request(app).get("/v1/user").send().expect(401);
  });
});
