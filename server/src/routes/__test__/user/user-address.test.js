import app from "../../../app.js";
import request from "supertest";

describe("User Address Functionality", () => {
  it("fails to add address if not authenticated", async () => {
    await request(app)
      .post("/v1/user/address")
      .send({ address: "123 Main St", paymentInformation: "card" })
      .expect(401);
  });
});
