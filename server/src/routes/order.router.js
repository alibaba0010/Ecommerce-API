import { Router } from "express";

import { verifyTokenAndAdmin } from "../services/auth.js";

import {
  authenticateUser,
  verifyAdminWithId,
  verifyUserWithId,
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
  .post(verifyUserWithId, httpCreateOrder)
  .get(httpGetAllOrders);
orderRouter
  .route("/order/:id")
  .patch(verifyTokenAndAdmin, httpUpdateOrder)
  .delete(httpDeleteOrder)
  .get(httpGetOrder);
orderRouter.get("/income", verifyTokenAndAdmin, httpGetIncome);

export default orderRouter;
