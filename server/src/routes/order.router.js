import express, { Router } from "express";

import {
  authenticateUser,
  verifyAdmin,
  verifyUser,
} from "../middleware/auth.js";

const orderRouter = Router();

import {
  httpCreateOrder,
  httpUpdateOrder,
  httpDeleteOrder,
  httpGetOrder,
  httpGetAllOrders,
  httpGetIncome,
  httpCreateStripeSession,
  httpCreatePayPalPayment,
  httpVerifyPayPalPayment,
  httpStripeWebhook,
} from "../controller/order.controller.js";

orderRouter
  .route("/order")
  .post(authenticateUser, verifyUser, httpCreateOrder)
  .get(authenticateUser, verifyAdmin, httpGetAllOrders);
orderRouter
  .route("/order/:id")
  .patch(authenticateUser, verifyAdmin, httpUpdateOrder)
  .delete(authenticateUser, verifyAdmin, httpDeleteOrder)
  .get(authenticateUser, verifyUser, httpGetOrder);
orderRouter.get("/income", authenticateUser, verifyAdmin, httpGetIncome);

// Payment routes
orderRouter.post(
  "/order/:orderId/stripe-session",
  authenticateUser,
  verifyUser,
  httpCreateStripeSession
);

orderRouter.post(
  "/order/:orderId/paypal-payment",
  authenticateUser,
  verifyUser,
  httpCreatePayPalPayment
);

orderRouter.post(
  "/order/:orderId/paypal-verify",
  authenticateUser,
  verifyUser,
  httpVerifyPayPalPayment
);

// Stripe webhook - no authentication needed as it's called by Stripe
orderRouter.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  httpStripeWebhook
);

export default orderRouter;
