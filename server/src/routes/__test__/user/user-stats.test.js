import app from "../../../app.js";
import request from "supertest";

describe("User Stats Functionality", () => {
  it("fails to get stats if not admin", async () => {
    await request(app).get("/v1/users/stats").expect(401);
  });
});
