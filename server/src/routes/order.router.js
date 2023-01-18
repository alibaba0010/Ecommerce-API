import { Router } from "express";

import { verifyTokenAndAdmin } from "../services/auth.js";

import {
  authenticateUser,
  verifyAdminWithId,
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
} from "../controller/order.controller.js";

orderRouter
  .route("/order")
  .post(authenticateUser, verifyUser, httpCreateOrder)
  .get(httpGetAllOrders);
orderRouter
  .route("/order/:id")
  .patch(authenticateUser,verifyTokenAndAdmin, httpUpdateOrder)
  .delete(httpDeleteOrder)
  .get(httpGetOrder);
orderRouter.get("/income", authenticateUser, verifyTokenAndAdmin, httpGetIncome);

export default orderRouter;
