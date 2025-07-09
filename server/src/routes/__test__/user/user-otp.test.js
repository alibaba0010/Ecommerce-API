import app from "../../../app.js";
import request from "supertest";

describe("User OTP Functionality", () => {
  it("generates an OTP", async () => {
    const res = await request(app).get("/v1/user/generate-otp").expect(200);
    expect(res.body.message).toMatch(/OTP generated successfully/i);
  });
});
