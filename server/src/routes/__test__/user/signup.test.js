import app from "../../app.js";
import request from "supertest";

// *******SIGN UP AS USERS OR ADMIN *****
it("returns a 201 on successful register", async () => {
  return (
    request(app)
      .post("/v1/users/register")
      // .post("/v1/admin/register")
      .send({
        username: "test",
        email: "test@test.com",
        password: "password",
        confirmPassword: "password",
      })
      .expect(201)
  );
});

// it("returns a 400 with an invalid username", async () => {
//   return request(app)
//     .post("/v1/users/register")
//     .post("/v1/admin/register")
//     .send({
//       username: "test", //put invlid name
//       email: "test@test.com",
//       password: "password",
//       confirmPassword: "password",
//     })
//     .expect(400);
// });
// it("returns a 400 with an invalid email", async () => {
//   return request(app)
//     .post("/v1/users/register")
//     .post("/v1/admin/register")
//     .send({
//       username: "test",
//       email: "alskdflaskjfd",
//       password: "password",
//       confirmPassword: "password",
//     })
//     .expect(400);
// });
// it("returns a 400 with an invalid password", async () => {
//   return request(app)
//     .post("/v1/users/register")
//     .post("/v1/admin/register")
//     .send({
//       username: "test",
//       email: "alskdflaskjfd",
//       email: "test@test.com",
//       password: "p",
//       confirmPassword: "password",
//     })
//     .expect(400);
// });

// it("returns a 400 with an unable to confirm password", async () => {
//   return request(app)
//     .post("/v1/users/register")
//     .post("/v1/admin/register")
//     .send({
//       username: "test",
//       email: "alskdflaskjfd",
//       email: "test@test.com",
//       password: "password",
//       confirmPassword: "passWord",
//     })
//     .expect(400);
// });

// // ******MISSING VALUE
// it("returns a 400 with missing username, email, password or password", async () => {
//   await request(app)
//     .post("/v1/users/register")
//     .post("/v1/admin/register")
//     .send({
//       email: "test@test.com",
//       password: "alskjdf",
//       confirmPassword: "alskjdf",
//     })
//     .expect(400);
//   await request(app)
//     .post("/v1/users/register")
//     .post("/v1/admin/register")
//     .send({
//       username: "test",
//       password: "alskjdf",
//       confirmPassword: "alskjdf",
//     })
//     .expect(400);
//   await request(app)
//     .post("/v1/users/register")
//     .post("/v1/admin/register")
//     .send({
//       username: "test",
//       email: "test@test.com",
//       confirmPassword: "alskjdf",
//     })
//     .expect(400);
//   await request(app)
//     .post("/v1/users/register")
//     .post("/v1/admin/register")
//     .send({
//       username: "test",
//       email: "test@test.com",
//       password: "alskjdf",
//     })
//     .expect(400);
// });

// //**********LOGIN*************
// it("fails with 400 when a email or username that does not exist is supplied", async () => {
//   await request(app)
//     .post("/v1/users/login")
//     .send({
//       value: "test@test.com",
//       password: "password",
//     })
//     .expect(400);

//   await request(app)
//     .post("/v1/users/login")
//     .send({
//       value: "test",
//       password: "password",
//     })
//     .expect(400);
// });

// it("fails when an incorrect password is supplied", async () => {
//   await request(app)
//     .post("/v1/users/register")
//     .send({
//       username: "test",
//       email: "test@test.com",
//       password: "password",
//       confirmPassword: "password",
//     })
//     .expect(201);

//   await request(app)
//     .post("/v1/users/login")
//     .send({
//       value: "test@test.com",
//       password: "aslkdfjalskdfj",
//     })
//     .expect(400);
//   await request(app)
//     .post("/v1/users/login")
//     .send({
//       value: "test",
//       password: "aslkdfjalskdfj",
//     })
//     .expect(400);
// });

// // *** VALID LOGIN ***
// it("responds with a token when given valid credentials", async () => {
//   await request(app)
//     .post("/v1/users/register")
//     .send({
//       username: "test",
//       email: "test@test.com",
//       password: "password",
//       confirmPassword: "password",
//     })
//     .expect(201);

//   const response = await request(app)
//     .post("/v1/users/login")
//     .send({
//       value: "test@test.com",
//       password: "password",
//     })
//     .expect(200);

//   // response.token
//   console.log(`Response in login ${response.token}`);
//   expect(response.get()).toBeDefined(); //"Set-Cookie"
// });

// //**********SIGN OUT*************
// it("clears the token after loging out", async () => {
//   await request(app)
//     .post("/v1/users/register")
//     .send({
//       email: "test@test.com",
//       password: "password",
//     })
//     .expect(201);

//   const response = await request(app)
//     .post("/v1/users/signout")
//     .send({})
//     .expect(200);

//   expect(response.get("Set-Cookie")[0]).toEqual(
//     "express:sess=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; httponly" //you can also use isDefined()
//   );
// });

// //**********CURRENT USER*************
// it("responds with details about the current user", async () => {
//   const cookie = await global.login();

//   const response = await request(app)
//     .get("/users/currentuser")
//     .set("Cookie", cookie)
//     .send()
//     .expect(200);

//   expect(response.body.currentUser.email).toEqual("test@test.com");
// });

// it("responds with null if not authenticated", async () => {
//   const response = await request(app)
//     .get("/v1/users/currentuser")
//     .send()
//     .expect(200);

//   expect(response.body.currentUser).toEqual(null);
// });