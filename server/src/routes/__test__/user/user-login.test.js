import app from "../../../app.js";
import request from "supertest";

//**********LOGIN*************
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
