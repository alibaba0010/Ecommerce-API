import { Router } from "express";
import { stripePayment } from "../controller/stripe.controller.js";

const stripeRouter = Router();
stripeRouter.post("/payment", stripePayment);
export default stripeRouter;
